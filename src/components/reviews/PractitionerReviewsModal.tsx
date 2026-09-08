import React, { useState } from 'react';
import { Practitioner, DigitalNexCareProvider, ExternalPractitionerUnlocked, ExternalPractitionerLocked } from '../../types';
import { ReviewService } from '../../lib/reviews/review-service';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Star,
  ShieldCheck,
  Lock,
  X,
  MessageSquare,
  ThumbsUp,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

interface PractitionerReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  practitioner: Practitioner | null;
  isUnlocked: boolean;
  onUnlockRequest?: () => void;
  revealsRemaining?: number;
}

export const PractitionerReviewsModal: React.FC<PractitionerReviewsModalProps> = ({
  isOpen,
  onClose,
  practitioner,
  isUnlocked,
  onUnlockRequest,
  revealsRemaining = 2,
}) => {
  if (!isOpen || !practitioner) return null;

  const [filterStar, setFilterStar] = useState<number | null>(null);
  const [helpfulVotes, setHelpfulVotes] = useState<{ [reviewId: string]: boolean }>({});

  const isVerifiedProvider = practitioner.practitionerType === 'DIGITALNEXCARE_PROVIDER';
  const effectiveUnlocked = isVerifiedProvider || isUnlocked;

  const metrics = ReviewService.getReviewsForPractitioner(practitioner.id, practitioner);

  const filteredReviews = filterStar
    ? metrics.reviews.filter((r) => Math.round(r.rating) === filterStar)
    : metrics.reviews;

  const practitionerName =
    'fullName' in practitioner
      ? practitioner.fullName
      : 'anonymizedTitle' in practitioner
      ? practitioner.anonymizedTitle
      : 'Healthcare Practitioner';

  const practiceName =
    'practiceName' in practitioner
      ? practitioner.practiceName
      : 'generalArea' in practitioner
      ? `Private Practice (${practitioner.generalArea})`
      : 'Healthcare Practice';

  const handleVoteHelpful = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{practitionerName}</h2>
              {isVerifiedProvider ? (
                <Badge variant="verified" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                  DigitalNexCare Verified
                </Badge>
              ) : effectiveUnlocked ? (
                <Badge variant="slate" size="sm">
                  Unlocked External
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
                  Profile Locked
                </Badge>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-[#176BFF]">{practitioner.specialty}</span>
              <span>•</span>
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{practiceName}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {effectiveUnlocked ? (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Rating Summary Card */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              {/* Left: Overall Score */}
              <div className="sm:col-span-4 flex flex-col items-center justify-center sm:border-r border-slate-200/80 sm:pr-4 text-center">
                <div className="text-4xl font-black text-slate-900">
                  {metrics.averageRating.toFixed(1)}
                </div>
                <div className="flex items-center gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(metrics.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1.5 font-medium">
                  Based on {metrics.reviewCount} verified review{metrics.reviewCount !== 1 ? 's' : ''}
                </div>
                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3" />
                  {metrics.verifiedPercentage}% Verified Consultations
                </div>
              </div>

              {/* Right: Distribution Bars */}
              <div className="sm:col-span-8 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = metrics.distribution[star] || 0;
                  const pct = metrics.reviewCount > 0 ? (count / metrics.reviewCount) * 100 : 0;
                  return (
                    <button
                      key={star}
                      onClick={() => setFilterStar(filterStar === star ? null : star)}
                      className={`w-full flex items-center gap-2 text-xs py-0.5 px-1.5 rounded-lg transition-colors text-left ${
                        filterStar === star ? 'bg-blue-50 font-bold' : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <span className="w-3 text-slate-700 font-semibold">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-slate-400 text-[11px]">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags preview */}
            {metrics.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-500 font-medium">Patient Highlights:</span>
                {metrics.tags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium"
                  >
                    {tag} ({count})
                  </span>
                ))}
              </div>
            )}

            {/* Filter Pill Controls */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFilterStar(null)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                    filterStar === null
                      ? 'bg-[#176BFF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Reviews ({metrics.reviewCount})
                </button>
                <button
                  onClick={() => setFilterStar(5)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                    filterStar === 5
                      ? 'bg-[#176BFF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 5 Stars (
                  {metrics.distribution[5] || 0})
                </button>
                <button
                  onClick={() => setFilterStar(4)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 ${
                    filterStar === 4
                      ? 'bg-[#176BFF] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4 Stars (
                  {metrics.distribution[4] || 0})
                </button>
              </div>

              {filterStar !== null && (
                <button
                  onClick={() => setFilterStar(null)}
                  className="text-xs text-[#176BFF] hover:underline font-medium"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No reviews found matching this filter.
                </div>
              ) : (
                filteredReviews.map((review) => {
                  const isVoted = helpfulVotes[review.id];
                  return (
                    <div
                      key={review.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5"
                    >
                      {/* Review Top row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#176BFF] font-bold text-xs flex items-center justify-center">
                            {review.patientName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              <span>{review.patientName}</span>
                              {review.verifiedVisit && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  <ShieldCheck className="w-2.5 h-2.5" />
                                  Verified Consultation
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              <span>{review.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-slate-700 leading-relaxed">{review.comment}</p>

                      {/* Practitioner Response Bubble */}
                      {review.practitionerResponse && (
                        <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-1">
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#176BFF]" />
                            <span>Response from Practice</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed">
                            {review.practitionerResponse}
                          </p>
                        </div>
                      )}

                      {/* Review footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span>Verified patient rating</span>
                        <button
                          onClick={() => handleVoteHelpful(review.id)}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors ${
                            isVoted ? 'text-emerald-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${isVoted ? 'fill-emerald-600' : ''}`} />
                          <span>{isVoted ? 'Helpful (1)' : 'Helpful'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* LOCKED STATE */
          <div className="p-6 sm:p-8 space-y-6">
            {/* Lock notification banner */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Patient Reviews & Comments Locked
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                  Written patient comments, detailed ratings, and consultation feedback are protected
                  for external practitioners until their profile is unlocked.
                </p>
              </div>

              {/* Anonymized Rating Preview */}
              <div className="inline-flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-amber-200 text-xs font-bold text-slate-800">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{metrics.averageRating.toFixed(1)} Overall Rating</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600">{metrics.reviewCount} Public Reviews</span>
              </div>
            </div>

            {/* Blurred masked preview cards */}
            <div className="space-y-3 opacity-60 pointer-events-none select-none">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-300" />
                    <div className="h-3 w-24 bg-slate-300 rounded" />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full bg-slate-200 rounded filter blur-[2px]" />
                  <div className="h-3 w-4/5 bg-slate-200 rounded filter blur-[2px]" />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-300" />
                    <div className="h-3 w-28 bg-slate-300 rounded" />
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-3 h-3 fill-amber-300 text-amber-300" />
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full bg-slate-200 rounded filter blur-[2px]" />
                  <div className="h-3 w-3/4 bg-slate-200 rounded filter blur-[2px]" />
                </div>
              </div>
            </div>

            {/* Unlocking Action Area */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-600 text-center sm:text-left">
                {revealsRemaining > 0 ? (
                  <span>
                    You have <strong className="text-slate-900">{revealsRemaining} free monthly reveals</strong> remaining on your plan.
                  </span>
                ) : (
                  <span className="text-amber-700 font-medium">
                    You have reached your free monthly external reveal limit.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-initial">
                  Cancel
                </Button>
                {onUnlockRequest && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onUnlockRequest();
                    }}
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="flex-1 sm:flex-initial"
                  >
                    {revealsRemaining > 0 ? 'Unlock to View Reviews & Contact' : 'View Subscription Plans'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
