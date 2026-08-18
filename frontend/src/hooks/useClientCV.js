import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * useClientCV — Client-side computer vision hook using MediaPipe FaceLandmarker.
 *
 * Returns:
 *   metrics: { eyeContact, posture, confidence, gestureScore } or null if no face
 *   frameMetrics: array of per-frame raw data (for server-side scoring)
 */
const useClientCV = (videoRef, isSessionActive) => {
    const [metrics, setMetrics] = useState(null);
    const [frameMetrics, setFrameMetrics] = useState([]);
    // Mirrors frameMetrics but as a ref, always holding the CURRENT value.
    // Needed because MediaRecorder's onstop handler (in InterviewDashboard)
    // is bound once when recording starts and closes over whatever
    // `frameMetrics` looked like at that instant — almost always empty,
    // since it was just reset for the new question. By the time recording
    // actually stops (seconds/minutes later, with real data accumulated the
    // whole time), that closure still only sees the frozen record-start
    // snapshot. A ref sidesteps closure staleness entirely: consumers read
    // frameMetricsRef.current at the moment they actually need it, not
    // whatever was captured when their callback was created. This was the
    // root cause of eye-contact/posture/gesture/confidence showing N/A (or
    // an inconsistent small number) despite live on-screen metrics working
    // fine — the live widget is driven by a separate, always-current state
    // update, but the data actually sent to the backend was stale.
    const frameMetricsRef = useRef([]);
    const intervalRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const isInitializingRef = useRef(false);
    // Tracks nose position across consecutive frames so we can compute a real
    // movement/fidgeting signal instead of hardcoding it to the posture score.
    const prevNoseRef = useRef(null);

    // Initialize MediaPipe
    useEffect(() => {
        const initMediaPipe = async () => {
            if (faceLandmarkerRef.current || isInitializingRef.current) return;
            isInitializingRef.current = true;
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
                );
                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                console.log("MediaPipe FaceLandmarker initialized");
            } catch (error) {
                console.error("Failed to initialize MediaPipe:", error);
            } finally {
                isInitializingRef.current = false;
            }
        };
        initMediaPipe();
    }, []);

    const analyzeFrame = useCallback(() => {
        const video = videoRef.current;
        const landmarker = faceLandmarkerRef.current;

        if (!video || video.readyState < 2 || !landmarker) return;

        try {
            const startTimeMs = performance.now();
            const results = landmarker.detectForVideo(video, startTimeMs);

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                // Face detected! Calculate metrics based on landmarks and blendshapes
                const blendshapes = results.faceBlendshapes[0].categories;

                // Helper to find blendshape score
                const getScore = (name) => {
                    const shape = blendshapes.find(b => b.categoryName === name);
                    return shape ? shape.score : 0;
                };

                // Eye Contact: Check if looking away (eyeLookOut, eyeLookIn, eyeLookUp, eyeLookDown)
                const lookOutL = getScore('eyeLookOutLeft');
                const lookInL = getScore('eyeLookInLeft');
                const lookOutR = getScore('eyeLookOutRight');
                const lookInR = getScore('eyeLookInRight');
                const lookUp = (getScore('eyeLookUpLeft') + getScore('eyeLookUpRight')) / 2;
                const lookDown = (getScore('eyeLookDownLeft') + getScore('eyeLookDownRight')) / 2;

                const maxLook = Math.max(lookOutL, lookInL, lookOutR, lookInR, lookUp, lookDown);
                // If maxLook is high, they are looking away. If low, they are looking at camera.
                const eyeContact = Math.max(0, Math.min(100, Math.round((1 - maxLook * 1.5) * 100)));

                // Posture: Check face bounding box size and position
                const landmarks = results.faceLandmarks[0];
                const nose = landmarks[1];
                // Is nose roughly in the center? (0.3 to 0.7)
                const isCentered = nose.x > 0.3 && nose.x < 0.7 && nose.y > 0.2 && nose.y < 0.8;
                const posture = isCentered ? 90 : 40;

                // Expressions / Confidence: Smile, brow furrow
                const smile = (getScore('mouthSmileLeft') + getScore('mouthSmileRight')) / 2;
                const browFurrow = (getScore('browInnerUp') + getScore('browDownLeft') + getScore('browDownRight')) / 3;

                const confidence = Math.max(0, Math.min(100, Math.round(50 + (smile * 50) - (browFurrow * 30))));

                // Gesture / movement score: FaceLandmarker has no hand tracking, so we
                // can't detect literal hand gestures. What we CAN measure honestly is
                // head movement (fidgeting/restlessness) between consecutive samples,
                // using the real delta in nose position — this is a genuine signal,
                // not a copy of the posture score.
                let fidgetingScore = 0; // 0 = still, 1 = high movement
                let movementDelta = 0;
                if (prevNoseRef.current) {
                    const dx = nose.x - prevNoseRef.current.x;
                    const dy = nose.y - prevNoseRef.current.y;
                    movementDelta = Math.sqrt(dx * dx + dy * dy);
                    // Typical still-sitting frame-to-frame delta is small; scale so
                    // ~0.08 normalized movement (a noticeable head shift) maps to 1.0
                    fidgetingScore = Math.max(0, Math.min(1, movementDelta / 0.08));
                }
                prevNoseRef.current = { x: nose.x, y: nose.y };
                const gestureScore = Math.round((1 - fidgetingScore) * 100);

                setMetrics({ eyeContact, posture, confidence, gestureScore });

                const frameData = {
                    eye_contact: { gaze_score: eyeContact / 100, looking_away_duration: eyeContact < 40 ? 1 : 0 },
                    posture: { posture_score: posture / 100, slouch_detected: !isCentered },
                    gestures: { fidgeting_score: fidgetingScore, gesture_count: 0 },
                    expressions: { confidence_level: confidence / 100, engagement_score: smile },
                    timestamp: Date.now(),
                };
                pushFrame(frameData);
            } else {
                // No face detected
                setMetrics(null);
                pushFrame({
                    eye_contact: null,
                    posture: null,
                    gestures: null,
                    expressions: null,
                    timestamp: Date.now(),
                    no_face_detected: true
                });
            }
        } catch (error) {
            console.error("Error analyzing frame:", error);
        }
    }, [videoRef]);

    useEffect(() => {
        if (isSessionActive) {
            // Analyze first frame immediately
            setTimeout(() => analyzeFrame(), 1000);
            intervalRef.current = setInterval(analyzeFrame, 3000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isSessionActive, analyzeFrame]);

    // Updates both the state (for live UI display / re-renders) and the ref
    // (for any consumer that needs the current value without depending on
    // React's render cycle — see the frameMetricsRef comment above).
    const pushFrame = useCallback((frameData) => {
        frameMetricsRef.current = [...frameMetricsRef.current, frameData];
        setFrameMetrics(frameMetricsRef.current);
    }, []);

    const resetFrameMetrics = useCallback(() => {
        frameMetricsRef.current = [];
        setFrameMetrics([]);
        // Prevent a stale nose-position delta from a previous question being
        // scored as "movement" on the very first frame of the new question.
        prevNoseRef.current = null;
    }, []);

    return { metrics, frameMetrics, frameMetricsRef, resetFrameMetrics };
};

export default useClientCV;
