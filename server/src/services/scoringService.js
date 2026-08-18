/**
 * Confidence scoring and metrics calculation utilities
 * Ported from backend/utils/scoring.py
 */

class ScoringService {
    constructor() {
        this.WEIGHTS = {
            eye_contact: 0.30,
            posture: 0.25,
            speech_clarity: 0.20,
            gestures: 0.10,
            expressions: 0.15,
        };

        this.LOOKING_AWAY_THRESHOLD = 3.0; // seconds
        this.LOOKING_AWAY_PENALTY = 5;
        this.SLOUCH_PENALTY = 3;
        this.FILLER_WORD_PENALTY = 2;
        this.FIDGETING_PENALTY = 4;

        this.FILLER_WORDS = [
            'um', 'uh', 'erm', 'ah', 'hmm',
            'like', 'you know', 'so', 'actually',
            'basically', 'literally', 'right', 'okay', 'well',
            'i mean', 'kind of', 'sort of',
            'you see', 'honestly', 'obviously',
            'essentially', 'to be honest',
            'at the end of the day',
        ];

        // NOTE: these must be real regex literals (\b not \\b). The double-
        // backslash version previously here matched a literal backslash+b,
        // which meant this pattern effectively never matched real text —
        // repeated-word detection was silently doing nothing.
        this.REPETITION_PATTERNS = [
            /\b(\w+)\s+\1\b/g, // Repeated consecutive words
            /\b(i mean,?\s*){2,}/g,
            /\b(you know,?\s*){2,}/g,
            /\b(so,?\s*){2,}/g,
        ];
    }

    _mean(arr) {
        if (!arr || arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b, 0) / arr.length;
    }

    _clamp(val, min = 0, max = 100) {
        return Math.max(min, Math.min(max, val));
    }

    /**
     * The ONE authoritative "Overall Interview Score" for a session.
     *
     * This intentionally leads with answer quality (55%) — whether you
     * actually said something relevant and correct — because that is the
     * actual point of an interview. Non-verbal presence (confidence) and
     * speech delivery matter, but must never outweigh whether real answers
     * were given. `completionRate` (fraction of questions that weren't
     * skipped) is included explicitly so a session with several skipped
     * questions can't hide behind strong scores on the few it did answer.
     *
     * If a component has no data (e.g. camera was off the whole session),
     * its weight is redistributed proportionally across the remaining
     * available components rather than silently dropping the score or
     * padding it with an assumed default.
     */
    calculateSessionOverallScore(averageAnswerScore, averageConfidence, averageSpeechClarity, completionRate) {
        const WEIGHTS = {
            answerQuality: 0.55,
            confidence: 0.20,
            speechClarity: 0.15,
            completion: 0.10,
        };

        const components = {
            answerQuality: averageAnswerScore,
            confidence: averageConfidence,
            speechClarity: averageSpeechClarity,
            completion: completionRate,
        };

        let weightedSum = 0;
        let totalWeight = 0;
        for (const key in components) {
            const val = components[key];
            if (val !== null && val !== undefined) {
                weightedSum += val * WEIGHTS[key];
                totalWeight += WEIGHTS[key];
            }
        }

        if (totalWeight === 0) return null;
        return this._clamp(weightedSum / totalWeight);
    }

    calculateOverallConfidence(
        eyeContactScore,
        postureScore,
        speechClarityScore,
        gestureScore,
        expressionScore
    ) {
        const scores = {
            eye_contact: eyeContactScore,
            posture: postureScore,
            speech_clarity: speechClarityScore,
            gestures: gestureScore,
            expressions: expressionScore,
        };

        let weightedSum = 0;
        let totalWeight = 0;
        for (const key in scores) {
            if (scores[key] !== null && scores[key] !== undefined) {
                weightedSum += scores[key] * this.WEIGHTS[key];
                totalWeight += this.WEIGHTS[key];
            }
        }

        if (totalWeight === 0) return null;

        // Normalize
        weightedSum = weightedSum / totalWeight;

        // Non-linear penalty: if any critical metric is below 25,
        // the overall score is dragged down significantly
        const criticalKeys = ['eye_contact', 'posture', 'speech_clarity'];
        let penaltyMultiplier = 1.0;

        for (const key of criticalKeys) {
            if (scores[key] !== null && scores[key] !== undefined) {
                if (scores[key] < 25) {
                    penaltyMultiplier *= 0.75;
                } else if (scores[key] < 40) {
                    penaltyMultiplier *= 0.9;
                }
            }
        }

        return this._clamp(weightedSum * penaltyMultiplier);
    }

    calculateEyeContactScore(gazeScores, lookingAwayDurations) {
        if (!gazeScores || gazeScores.length === 0) return null;

        const avgGaze = this._mean(gazeScores);
        let baseScore;

        // Ideal range: 0.55 - 0.85 gaze score
        // Perfect score at ~0.70 (70% eye contact)
        if (avgGaze >= 0.55 && avgGaze <= 0.85) {
            baseScore = 75 + (1.0 - Math.abs(avgGaze - 0.70) * 4) * 25;
        } else if (avgGaze > 0.85) {
            // Too much eye contact (staring) — slight penalty
            baseScore = 80 - (avgGaze - 0.85) * 100;
        } else {
            // Too little eye contact
            baseScore = avgGaze * 100;
        }

        // Apply penalties for prolonged looking away
        let penalty = 0;
        for (const duration of lookingAwayDurations) {
            if (duration > this.LOOKING_AWAY_THRESHOLD) {
                penalty += this.LOOKING_AWAY_PENALTY;
            } else if (duration > 1.5) {
                penalty += 2; // Minor penalty for medium gaps
            }
        }

        return this._clamp(baseScore - penalty);
    }

    calculatePostureScore(postureScores, slouchCount) {
        if (!postureScores || postureScores.length === 0) return null;

        const baseScore = this._mean(postureScores) * 100;
        let penalty = 0;

        // Progressive penalty
        if (slouchCount <= 2) {
            penalty = slouchCount * 2;
        } else if (slouchCount <= 5) {
            penalty = 4 + (slouchCount - 2) * 3;
        } else {
            penalty = 13 + (slouchCount - 5) * 5;
        }

        return this._clamp(baseScore - penalty);
    }

    calculateSpeechClarityScore(wordsPerMinute, fillerWordCount, totalWords) {
        if (totalWords === 0) return null;

        let wpmScore;
        // WPM scoring with ideal range (110-165)
        if (wordsPerMinute >= 110 && wordsPerMinute <= 165) {
            wpmScore = 90 + (1.0 - Math.abs(wordsPerMinute - 140) / 50) * 10;
        } else if (wordsPerMinute > 165) {
            // Nervous rushing penalty
            const overspeed = wordsPerMinute - 165;
            wpmScore = Math.max(30, 90 - overspeed * 1.5);
        } else if (wordsPerMinute < 110 && wordsPerMinute > 0) {
            // Too slow
            const underspeed = 110 - wordsPerMinute;
            wpmScore = Math.max(40, 90 - underspeed * 1.0);
        } else {
            wpmScore = 30;
        }

        // Filler word penalty based on ratio
        const fillerRatio = fillerWordCount / totalWords;
        let fillerPenalty = 0;

        if (fillerRatio <= 0.02) {
            fillerPenalty = 0;
        } else if (fillerRatio <= 0.05) {
            fillerPenalty = fillerRatio * 200;
        } else if (fillerRatio <= 0.10) {
            fillerPenalty = 10 + (fillerRatio - 0.05) * 400;
        } else {
            fillerPenalty = 30 + (fillerRatio - 0.10) * 500;
        }

        return this._clamp(wpmScore - fillerPenalty);
    }

    calculateGestureScore(fidgetingScores, gestureCounts) {
        if (!fidgetingScores || fidgetingScores.length === 0) return null;

        const avgFidgeting = this._mean(fidgetingScores);
        let baseScore = (1 - avgFidgeting) * 100;

        const avgGestures = this._mean(gestureCounts);
        if (avgGestures > 5) {
            const penalty = (avgGestures - 5) * 3;
            baseScore -= penalty;
        }

        return this._clamp(baseScore);
    }

    calculateExpressionScore(confidenceLevels, engagementScores) {
        if (!confidenceLevels || confidenceLevels.length === 0 || !engagementScores || engagementScores.length === 0) {
            return null;
        }

        const avgConfidence = this._mean(confidenceLevels);
        const avgEngagement = this._mean(engagementScores);

        const score = (avgConfidence * 0.55 + avgEngagement * 0.45) * 100;
        return this._clamp(score);
    }

    aggregateSessionMetrics(frameMetrics) {
        if (!frameMetrics || frameMetrics.length === 0) {
            return {
                eye_contact_percentage: null,
                posture_score: null,
                expression_confidence: null,
                gesture_score: null,
                overall_confidence: null,
            };
        }

        const gazeScores = [];
        const lookingAwayDurations = [];
        const postureScores = [];
        let slouchCount = 0;
        const fidgetingScores = [];
        const gestureCounts = [];
        const confidenceLevels = [];
        const engagementScores = [];

        for (const frame of frameMetrics) {
            // Use ?? (not ||) below: a genuine 0 score (e.g. zero eye contact,
            // completely slouched) must stay 0, not get silently replaced with
            // a "decent" default just because 0 is falsy. || was masking real
            // bad performance as mediocre-but-acceptable.
            if (frame.eye_contact) {
                gazeScores.push(frame.eye_contact.gaze_score ?? 0);
                const dur = frame.eye_contact.looking_away_duration ?? 0;
                if (dur > 0.5) lookingAwayDurations.push(dur);
            }

            if (frame.posture) {
                postureScores.push(frame.posture.posture_score ?? 0);
                if (frame.posture.slouch_detected) slouchCount++;
            }

            if (frame.gestures) {
                fidgetingScores.push(frame.gestures.fidgeting_score ?? 0);
                gestureCounts.push(frame.gestures.gesture_count ?? 0);
            }

            if (frame.expressions) {
                confidenceLevels.push(frame.expressions.confidence_level ?? 0);
                engagementScores.push(frame.expressions.engagement_score ?? 0);
            }
        }

        const eyeContactScore = this.calculateEyeContactScore(gazeScores, lookingAwayDurations);
        const postureScore = this.calculatePostureScore(postureScores, slouchCount);
        const gestureScore = this.calculateGestureScore(fidgetingScores, gestureCounts);
        const expressionScore = this.calculateExpressionScore(confidenceLevels, engagementScores);

        return {
            eye_contact_percentage: eyeContactScore,
            posture_score: postureScore,
            expression_confidence: expressionScore,
            gesture_score: gestureScore,
        };
    }

    detectFillerWords(text, wordsArray = []) {
        const textLower = text.toLowerCase();

        let totalFillerCount = 0;
        let trueSpeakingTime = 0;
        const fillerAnalysis = {};

        // If we have word-level timestamps from Whisper
        if (wordsArray && wordsArray.length > 0) {
            for (let i = 0; i < wordsArray.length; i++) {
                const wordObj = wordsArray[i];
                const wordText = wordObj.word.toLowerCase().replace(/[^a-z0-9]/g, '');

                // Calculate true speaking time
                if (wordObj.end && wordObj.start) {
                    trueSpeakingTime += (wordObj.end - wordObj.start);
                }

                // Check if it's a filler word
                if (this.FILLER_WORDS.includes(wordText)) {
                    // Check for surrounding pause (e.g., > 0.5s gap before or after)
                    let isFiller = false;

                    // Short token check (most fillers are short)
                    if (wordText.length <= 4 || ['actually', 'basically', 'literally'].includes(wordText)) {
                        const prevWord = i > 0 ? wordsArray[i - 1] : null;
                        const nextWord = i < wordsArray.length - 1 ? wordsArray[i + 1] : null;

                        const pauseBefore = prevWord ? (wordObj.start - prevWord.end) : 0;
                        const pauseAfter = nextWord ? (nextWord.start - wordObj.end) : 0;

                        // If there's a noticeable pause around the word, it's likely a filler
                        if (pauseBefore > 0.3 || pauseAfter > 0.3) {
                            isFiller = true;
                        }
                    }

                    if (isFiller) {
                        fillerAnalysis[wordText] = (fillerAnalysis[wordText] || 0) + 1;
                        totalFillerCount++;
                    }
                }
            }
        } else {
            // Fallback to basic text matching if no timestamps
            const words = textLower.split(/\s+/).filter(w => w.length > 0);
            for (const filler of this.FILLER_WORDS) {
                const regex = new RegExp(`\\b${filler}\\b`, 'g');
                const matches = textLower.match(regex);
                if (matches) {
                    fillerAnalysis[filler] = matches.length;
                    totalFillerCount += matches.length;
                }
            }
        }

        let repetitionCount = 0;
        for (const pattern of this.REPETITION_PATTERNS) {
            const matches = textLower.match(pattern);
            if (matches) {
                repetitionCount += matches.length;
            }
        }

        if (repetitionCount > 0) {
            fillerAnalysis['[word repetitions]'] = repetitionCount;
            totalFillerCount += repetitionCount;
        }

        const wordCount = wordsArray.length > 0 ? wordsArray.length : textLower.split(/\s+/).filter(w => w.length > 0).length;

        // Calculate filler rate (fillers per 100 words)
        const fillerRate = wordCount > 0 ? (totalFillerCount / wordCount) * 100 : 0;

        return {
            filler_words: fillerAnalysis,
            total_filler_count: totalFillerCount,
            total_words: wordCount,
            filler_rate_per_100: fillerRate,
            true_speaking_time_seconds: trueSpeakingTime,
            repetition_count: repetitionCount,
        };
    }

    calculateSpeechPace(wordCount, durationSeconds, trueSpeakingTimeSeconds = null) {
        // Use true speaking time if available, otherwise fallback to total duration
        const effectiveDuration = (trueSpeakingTimeSeconds && trueSpeakingTimeSeconds > 0)
            ? trueSpeakingTimeSeconds
            : durationSeconds;

        if (effectiveDuration <= 0) return 0.0;
        return (wordCount / effectiveDuration) * 60;
    }
}

export default new ScoringService();
