import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PatientLayout } from '../../components/layout/PatientLayout';
import { PatientService } from '../../lib/patient/patient-service';
import { PatientReviewRecord } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Star,
  ShieldCheck,
  Calendar,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  UserCheck,
  CheckCircle2,
} from 'lucide-react';

export const PatientReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<PatientReviewRecord[]>(() =>
    PatientService.getReviews()
  );

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : '5.0';

  return (
    <PatientLayout
      title="My Verified Healthcare Reviews"
      subtitle="Reviews submitted from completed appointments to empower transparent, trusted healthcare access across South Africa."
    >
      <div className="space-y-6">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center flex-shrink-0">
              <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-slate-900">{avgRating}</span>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <Badge variant="verified" size="sm">
                  100% Verified Visits
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                You have contributed {reviews.length} verified review{reviews.length !== 1 ? 's' : ''} to South Africa's healthcare network.
              </p>
            </div>
          </div>

          <Link to="/patient/appointments">
            <Button variant="outline" size="sm">
              View Completed Consultations
            </Button>
          </Link>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 border border-slate-200 text-center space-y-3">
              <Star className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700">No Reviews Written Yet</h3>
              <p className="text-xs text-slate-400">
                After you attend an appointment with a DigitalNexCare provider, you can leave a verified review.
              </p>
              <Link to="/patient/appointments">
                <Button variant="primary" size="sm">
                  Check Appointments
                </Button>
              </Link>
            </div>
          ) : (
            reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900">{rev.providerName}</h3>
                      {rev.verifiedVisit && (
                        <Badge variant="verified" size="sm">
                          Verified Patient Visit
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Reviewed on{' '}
                      {new Date(rev.createdAt).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-900 ml-1">
                      {rev.rating}.0
                    </span>
                  </div>
                </div>

                {/* Sub-ratings */}
                <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Punctuality</span>
                    <strong className="text-slate-900 font-bold">{rev.waitingTimeRating}/5</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Bedside Manner</span>
                    <strong className="text-slate-900 font-bold">{rev.bedsideMannerRating}/5</strong>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">Facility Hygiene</span>
                    <strong className="text-slate-900 font-bold">{rev.facilityRating}/5</strong>
                  </div>
                </div>

                {/* Tags */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(rev.tags || []).map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#176BFF] border border-blue-100"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Comment */}
                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  "{rev.comment}"
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </PatientLayout>
  );
};
