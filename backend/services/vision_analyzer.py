"""
Computer Vision Analysis using MediaPipe and OpenCV
Analyzes eye contact, posture, gestures, and expressions
"""
import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, Any, Tuple, Optional
import base64
import math


class VisionAnalyzer:
    """
    Analyzes video frames for interview performance metrics using MediaPipe
    """
    
    def __init__(self):
        # Initialize MediaPipe solutions
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_pose = mp.solutions.pose
        self.mp_hands = mp.solutions.hands
        
        # Initialize detectors
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        self.hands = self.mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Tracking state
        self.previous_hand_positions = []
        self.looking_away_start = None
        self.looking_away_duration = 0.0
    
    def decode_frame(self, frame_base64: str) -> Optional[np.ndarray]:
        """
        Decode base64 frame to numpy array
        
        Args:
            frame_base64: Base64 encoded image
            
        Returns:
            Decoded image as numpy array or None if failed
        """
        try:
            # Remove data URL prefix if present
            if ',' in frame_base64:
                frame_base64 = frame_base64.split(',')[1]
            
            # Decode base64
            img_data = base64.b64decode(frame_base64)
            nparr = np.frombuffer(img_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            return frame
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None
    
    def analyze_frame(self, frame_base64: str, timestamp: float) -> Dict[str, Any]:
        """
        Analyze a single frame for all metrics
        
        Args:
            frame_base64: Base64 encoded frame
            timestamp: Timestamp of the frame
            
        Returns:
            Dictionary containing all analysis results
        """
        frame = self.decode_frame(frame_base64)
        
        if frame is None:
            return self._get_default_metrics(timestamp)
        
        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Analyze different aspects
        eye_contact = self._analyze_eye_contact(rgb_frame, timestamp)
        posture = self._analyze_posture(rgb_frame)
        gestures = self._analyze_gestures(rgb_frame)
        expressions = self._analyze_expressions(rgb_frame)
        
        # Calculate overall confidence
        overall_confidence = self._calculate_frame_confidence(
            eye_contact, posture, gestures, expressions
        )
        
        return {
            'eye_contact': eye_contact,
            'posture': posture,
            'gestures': gestures,
            'expressions': expressions,
            'overall_confidence': overall_confidence,
            'timestamp': timestamp
        }
    
    def _analyze_eye_contact(self, frame: np.ndarray, timestamp: float) -> Dict[str, Any]:
        """
        Analyze eye contact and gaze direction using face mesh
        """
        results = self.face_mesh.process(frame)
        
        if not results.multi_face_landmarks:
            if self.looking_away_start is None:
                self.looking_away_start = timestamp
            self.looking_away_duration = timestamp - self.looking_away_start
            
            return {
                'is_looking_at_camera': False,
                'gaze_score': 0.0,
                'looking_away_duration': self.looking_away_duration
            }
        
        face_landmarks = results.multi_face_landmarks[0]
        
        # Get eye landmarks (left eye: 468, right eye: 473)
        # Iris landmarks for gaze estimation
        h, w = frame.shape[:2]
        
        # Left eye center (approximate)
        left_eye_x = face_landmarks.landmark[468].x
        left_eye_y = face_landmarks.landmark[468].y
        
        # Right eye center (approximate)
        right_eye_x = face_landmarks.landmark[473].x
        right_eye_y = face_landmarks.landmark[473].y
        
        # Face center
        nose_tip = face_landmarks.landmark[1]
        face_center_x = nose_tip.x
        face_center_y = nose_tip.y
        
        # Calculate gaze direction (simplified)
        # In a real scenario, looking at camera means eyes are centered
        gaze_offset_x = abs((left_eye_x + right_eye_x) / 2 - 0.5)
        gaze_offset_y = abs((left_eye_y + right_eye_y) / 2 - 0.5)
        
        # Gaze score: 1.0 = looking directly, 0.0 = looking away
        gaze_score = max(0, 1.0 - (gaze_offset_x * 2 + gaze_offset_y * 2))
        
        is_looking_at_camera = gaze_score > 0.6
        
        if is_looking_at_camera:
            self.looking_away_start = None
            self.looking_away_duration = 0.0
        else:
            if self.looking_away_start is None:
                self.looking_away_start = timestamp
            self.looking_away_duration = timestamp - self.looking_away_start
        
        return {
            'is_looking_at_camera': is_looking_at_camera,
            'gaze_score': float(gaze_score),
            'looking_away_duration': self.looking_away_duration
        }
    
    def _analyze_posture(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyze body posture using pose detection
        """
        results = self.pose.process(frame)
        
        if not results.pose_landmarks:
            return {
                'is_upright': True,
                'posture_score': 0.5,
                'slouch_detected': False,
                'shoulder_alignment': 0.5
            }
        
        landmarks = results.pose_landmarks.landmark
        
        # Get shoulder landmarks
        left_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER]
        right_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER]
        
        # Get nose and hip for posture analysis
        nose = landmarks[self.mp_pose.PoseLandmark.NOSE]
        left_hip = landmarks[self.mp_pose.PoseLandmark.LEFT_HIP]
        right_hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP]
        
        # Calculate shoulder alignment (should be horizontal)
        shoulder_slope = abs(left_shoulder.y - right_shoulder.y)
        shoulder_alignment = max(0, 1.0 - shoulder_slope * 10)
        
        # Calculate posture (head should be above shoulders)
        head_shoulder_alignment = nose.y < (left_shoulder.y + right_shoulder.y) / 2
        
        # Check for slouching (simplified: if head is too far forward)
        shoulder_center_x = (left_shoulder.x + right_shoulder.x) / 2
        head_forward_distance = abs(nose.x - shoulder_center_x)
        
        slouch_detected = head_forward_distance > 0.15
        is_upright = head_shoulder_alignment and not slouch_detected
        
        # Posture score
        posture_score = shoulder_alignment * 0.5
        if is_upright:
            posture_score += 0.3
        if not slouch_detected:
            posture_score += 0.2
        
        return {
            'is_upright': bool(is_upright),
            'posture_score': float(posture_score),
            'slouch_detected': bool(slouch_detected),
            'shoulder_alignment': float(shoulder_alignment)
        }
    
    def _analyze_gestures(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyze hand gestures and fidgeting
        """
        results = self.hands.process(frame)
        
        if not results.multi_hand_landmarks:
            self.previous_hand_positions = []
            return {
                'hand_detected': False,
                'gesture_count': 0,
                'fidgeting_score': 0.0,
                'hand_positions': []
            }
        
        hand_positions = []
        gesture_count = len(results.multi_hand_landmarks)
        
        # Track hand positions for fidgeting detection
        current_positions = []
        for hand_landmarks in results.multi_hand_landmarks:
            # Use wrist position as reference
            wrist = hand_landmarks.landmark[0]
            current_positions.append((wrist.x, wrist.y))
            
            # Determine hand position (simplified)
            if wrist.y < 0.5:
                hand_positions.append('raised')
            else:
                hand_positions.append('lowered')
        
        # Calculate fidgeting score based on movement
        fidgeting_score = 0.0
        if self.previous_hand_positions and len(current_positions) == len(self.previous_hand_positions):
            total_movement = 0.0
            for curr, prev in zip(current_positions, self.previous_hand_positions):
                movement = math.sqrt((curr[0] - prev[0])**2 + (curr[1] - prev[1])**2)
                total_movement += movement
            
            # Normalize fidgeting score (higher = more fidgeting)
            fidgeting_score = min(1.0, total_movement * 5)
        
        self.previous_hand_positions = current_positions
        
        return {
            'hand_detected': True,
            'gesture_count': gesture_count,
            'fidgeting_score': float(fidgeting_score),
            'hand_positions': hand_positions
        }
    
    def _analyze_expressions(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Analyze facial expressions for confidence and engagement
        """
        results = self.face_mesh.process(frame)
        
        if not results.multi_face_landmarks:
            return {
                'confidence_level': 0.5,
                'smile_detected': False,
                'expression_type': 'neutral',
                'engagement_score': 0.5
            }
        
        face_landmarks = results.multi_face_landmarks[0]
        
        # Mouth landmarks for smile detection
        # Upper lip: 13, Lower lip: 14, Left corner: 61, Right corner: 291
        upper_lip = face_landmarks.landmark[13]
        lower_lip = face_landmarks.landmark[14]
        left_corner = face_landmarks.landmark[61]
        right_corner = face_landmarks.landmark[291]
        
        # Calculate mouth opening
        mouth_opening = abs(upper_lip.y - lower_lip.y)
        
        # Calculate smile (corners higher than center)
        corner_height = (left_corner.y + right_corner.y) / 2
        mouth_center_y = (upper_lip.y + lower_lip.y) / 2
        
        smile_detected = corner_height < mouth_center_y - 0.01
        
        # Eyebrow position for engagement (simplified)
        # Higher eyebrows often indicate engagement
        left_eyebrow = face_landmarks.landmark[70]
        right_eyebrow = face_landmarks.landmark[300]
        eyebrow_height = 1.0 - (left_eyebrow.y + right_eyebrow.y) / 2
        
        # Confidence level based on facial features
        confidence_level = 0.6  # Base confidence
        if smile_detected:
            confidence_level += 0.2
        if eyebrow_height > 0.6:
            confidence_level += 0.1
        
        confidence_level = min(1.0, confidence_level)
        
        # Expression type
        if smile_detected:
            expression_type = 'happy'
        elif mouth_opening > 0.05:
            expression_type = 'speaking'
        else:
            expression_type = 'neutral'
        
        # Engagement score
        engagement_score = (confidence_level + eyebrow_height) / 2
        
        return {
            'confidence_level': float(confidence_level),
            'smile_detected': bool(smile_detected),
            'expression_type': expression_type,
            'engagement_score': float(engagement_score)
        }
    
    def _calculate_frame_confidence(
        self,
        eye_contact: Dict,
        posture: Dict,
        gestures: Dict,
        expressions: Dict
    ) -> float:
        """
        Calculate overall confidence for a single frame
        """
        # Weights
        eye_weight = 0.30
        posture_weight = 0.25
        gesture_weight = 0.15
        expression_weight = 0.15
        speech_weight = 0.15  # Will be calculated separately
        
        # Normalize scores to 0-100
        eye_score = eye_contact['gaze_score'] * 100
        posture_score = posture['posture_score'] * 100
        gesture_score = (1 - gestures['fidgeting_score']) * 100
        expression_score = expressions['confidence_level'] * 100
        
        # Weighted average (excluding speech for now)
        total_weight = eye_weight + posture_weight + gesture_weight + expression_weight
        
        confidence = (
            eye_score * eye_weight +
            posture_score * posture_weight +
            gesture_score * gesture_weight +
            expression_score * expression_weight
        ) / total_weight
        
        return max(0, min(100, confidence))
    
    def _get_default_metrics(self, timestamp: float) -> Dict[str, Any]:
        """
        Return default metrics when frame analysis fails
        """
        return {
            'eye_contact': {
                'is_looking_at_camera': False,
                'gaze_score': 0.0,
                'looking_away_duration': 0.0
            },
            'posture': {
                'is_upright': True,
                'posture_score': 0.5,
                'slouch_detected': False,
                'shoulder_alignment': 0.5
            },
            'gestures': {
                'hand_detected': False,
                'gesture_count': 0,
                'fidgeting_score': 0.0,
                'hand_positions': []
            },
            'expressions': {
                'confidence_level': 0.5,
                'smile_detected': False,
                'expression_type': 'neutral',
                'engagement_score': 0.5
            },
            'overall_confidence': 50.0,
            'timestamp': timestamp
        }
    
    def cleanup(self):
        """
        Release resources
        """
        self.face_mesh.close()
        self.pose.close()
        self.hands.close()
