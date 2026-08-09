from typing import List ,Dict ,Any 
from backend .models .anomaly import AnomalyLog ,FlagType 

class TrustScoreCalculator :
    """
    Calculates dynamic trust score reductions based on weighted penalty metrics.
    """

    BASE_SCORE =100.0 

    FLAG_WEIGHTS ={
    FlagType .GAZE_OFFSCREEN :2.0 ,
    FlagType .NO_FACE_DETECTED :4.0 ,
    FlagType .AUDIO_DISTURBANCE :3.0 ,
    FlagType .MULTIPLE_FACES :12.0 ,
    }

    @classmethod 
    def calculate_current_score (cls ,anomaly_logs :List [AnomalyLog ])->float :
        """
        Computes the current trust score given a list of logged anomaly events.
        """
        total_deduction =0.0 

        for log in anomaly_logs :
            weight =cls .FLAG_WEIGHTS .get (log .flag_type ,2.0 )
            confidence =log .confidence_score if log .confidence_score else 1.0 
            total_deduction +=weight *confidence 

        final_score =max (0.0 ,cls .BASE_SCORE -total_deduction )
        return round (final_score ,2 )

    @classmethod 
    def get_integrity_summary (cls ,trust_score :float ,anomaly_count :int )->Dict [str ,Any ]:
        """
        Generates an audit status rating for faculty reports.
        """
        if trust_score >=85.0 :
            status ="HIGH_INTEGRITY"
            recommendation ="Exam cleared automatically. No suspicious behavior detected."
        elif trust_score >=65.0 :
            status ="NEEDS_REVIEW"
            recommendation ="Minor anomalies flagged. Recommended for quick faculty review."
        else :
            status ="CRITICAL_FLAG"
            recommendation ="Multiple high-severity anomalies detected. Manual review required."

        return {
        "final_trust_score":trust_score ,
        "total_anomalies":anomaly_count ,
        "status":status ,
        "recommendation":recommendation 
        }
