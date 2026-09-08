import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth/context';
import { UserUnlockService } from '../../lib/subscription/user-unlock-service';
import { UnlockedExternalCard } from '../../components/external-practitioner/UnlockedExternalCard';
import { LockedExternalCard } from '../../components/external-practitioner/LockedExternalCard';
import { ReviewService } from '../../lib/reviews/review-service';
import { SubscriptionModal } from '../../components/subscription/SubscriptionModal';
import {
  ArrowLeft,
  Info,
  Star,
  Lock,
  Sparkles,
  ShieldCheck,
  MessageSquare,
  ThumbsUp,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { ExternalPractitionerUnlocked, ExternalPractitionerLocked } from '../../types';
import { Button } from '../../components/ui/Button';

export const ExternalPractitionerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, revealsRemaining, unlockPractitioner } = useAuth();
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [, setForceUpdate] = useState(0);

  const resolution = id ? UserUnlockService.getPractitionerForUser(user?.id, id) : null;
  const practitioner = resolution?.practitioner;
  const isUnlocked = resolution?.isUnlocked || false;

  const reviewMetrics = id && practitioner
    ? ReviewService.getReviewsForPractitioner(id, practitioner as any)
    : null;

  const handleUnlockClick = () => {
    if (!id) return;
    if (revealsRemaining <= 0) {
      setIsSubscriptionModalOpen(true);
      return;
    }
    const res = unlockPractitioner(id);
    if (res.success) {
      setForceUpdate((v) => v + 1);
    } else {
      setIsSubscriptionModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/find-care"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Healthcare Directory
        </Link>

        {/* Informational Banner */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-slate-700 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#176BFF] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>External Directory Record:</strong> This healthcare practice is indexed from public registers. DigitalNexCare does not manage direct scheduling for external practitioners. Contact the practice directly using the provided details.
          </p>
        </div>

        {/* Render Appropriate Card */}
        {practitioner && isUnlocked ? (
          <UnlockedExternalCard practitioner={practitioner as ExternalPractitionerUnlocked} />
        ) : practitioner && !isUnlocked ? (
          <LockedExternalCard
            practitioner={practitioner as ExternalPractitionerLocked}
            onUnlockedSuccess={() => setForceUpdate((v) => v + 1)}
          />
        ) : (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
            <h2 className="text-base font-bold text-slate-800">Practitioner Record Not Found</h2>
            <Link to="/find-care" className="text-xs text-[#176BFF] font-semibold mt-2 inline-block">
              Return to Find Care
            </Link>
          </div>
        )}

        {/* Patient Reviews & Verified Comments Section */}
        {practitioner && reviewMetrics && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#176BFF]" />
                  Patient Reviews & Experience
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verified patient feedback from community appointments and HPCSA regional feedback
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900 leading-none">
                    {reviewMetrics.averageRating.toFixed(1)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    out of 5.0 ({reviewMetrics.reviewCount} reviews)
                  </div>
                </div>
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(reviewMetrics.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-100 text-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* If Unlocked: Show Full Reviews List */}
            {isUnlocked ? (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                  <span className="font-semibold text-slate-700">
                    Showing all {reviewMetrics.reviews.length} verified patient comments
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="w-4 h-4" /> 100% Verified Consultations
                  </span>
                </div>

                <div className="space-y-3.5">
                  {reviewMetrics.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-all hover:bg-slate-50/90"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{rev.patientName}</span>
                          {rev.verifiedVisit && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ShieldCheck className="w-3 h-3" /> Verified Visit
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400">{rev.date}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{rev.comment}</p>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {rev.tags.map((t, tidx) => (
                            <span
                              key={tidx}
                              className="text-[10px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {rev.practitionerResponse && (
                        <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700">
                          <span className="font-bold text-blue-900 block mb-0.5">Response from Practice:</span>
                          <p>{rev.practitionerResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* If Locked: Show locked blurbs with CTA */
              <div className="mt-6">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-6 sm:p-8 text-center">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                      <Lock className="w-6 h-6" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      Detailed Patient Reviews & Comments Locked
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Detailed comments, wait time feedback, and direct contact details for this external practitioner are reserved for unlocked profiles.
                    </p>

                    {/* Preview snippets masked */}
                    <div className="pt-2 space-y-2 text-left opacity-60 filter blur-[1px] select-none pointer-events-none">
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                        <div className="font-bold text-slate-700 mb-1">★★★★★ Patient Feedback</div>
                        <div className="text-slate-500">Dr. took time to explain diagnostic options and staff was...</div>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs">
                        <div className="font-bold text-slate-700 mb-1">★★★★★ Gentle and professional</div>
                        <div className="text-slate-500">Practice was very clean and consultation was on time...</div>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                      {revealsRemaining > 0 ? (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={handleUnlockClick}
                          leftIcon={<Sparkles className="w-4 h-4" />}
                        >
                          Unlock This Practitioner ({revealsRemaining} reveals left)
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setIsSubscriptionModalOpen(true)}
                          rightIcon={<ArrowUpRight className="w-4 h-4" />}
                        >
                          Subscribe to Read Full Reviews
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Subscription Paywall Modal */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        onUpgradeSuccess={() => setForceUpdate((v) => v + 1)}
      />
    </div>
  );
};
