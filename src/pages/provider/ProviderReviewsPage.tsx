import React, { useState } from 'react';
import { ProviderLayout } from '../../components/layout/ProviderLayout';
import { Chunk8OperationsService } from '../../lib/admin/chunk8-service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Clock,
  ThumbsUp,
  UserCheck,
  Send,
  Sparkles,
} from 'lucide-react';

export const ProviderReviewsPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>(
    Chunk8OperationsService.getProviderReviews('prov-001')
  );

  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [activeAppealId, setActiveAppealId] = useState<string | null>(null);
  const [appealReason, setAppealReason] = useState('');
  const [notificationMsg, setNotificationMsg] = useState('');

  const handlePostReply = (reviewId: string) => {
    if (!replyText.trim()) return;
    const updated = Chunk8OperationsService.respondToReview('prov-001', reviewId, replyText);
    setReviews([...updated]);
    setActiveReplyId(null);
    setReplyText('');
    setNotificationMsg('Public practitioner response published successfully.');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  const handleFileAppeal = (reviewId: string) => {
    if (!appealReason.trim()) return;
    Chunk8OperationsService.appealReview(reviewId, 'Dr. Naledi Mokoena', appealReason);
    setActiveAppealId(null);
    setAppealReason('');
    setNotificationMsg('Review dispute ticket logged with Trust & Safety Operations.');
    setTimeout(() => setNotificationMsg(''), 4000);
  };

  return (
    <ProviderLayout
      title="Patient Reviews & Verified Reputation"
      subtitle="Manage patient feedback, post practitioner replies, and audit appointment-verified reviews."
    >
      <div className="space-y-6">
        {/* Rating Summary Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex flex-col items-center justify-center font-black text-2xl border border-amber-200">
              <span>4.9</span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Outstanding Practice Rating
              </h3>
              <p className="text-xs text-slate-500">Based on 128 verified consultations</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 border-y md:border-y-0 md:border-x border-slate-100 py-4 md:py-0 md:px-6">
            <div className="flex items-center justify-between">
              <span>5 Stars</span>
              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[92%]" />
              </div>
              <span className="font-bold">118</span>
            </div>
            <div className="flex items-center justify-between">
              <span>4 Stars</span>
              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[6%]" />
              </div>
              <span className="font-bold">8</span>
            </div>
            <div className="flex items-center justify-between">
              <span>3 Stars</span>
              <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[2%]" />
              </div>
              <span className="font-bold">2</span>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-emerald-950 block">100% Verified Bookings Gate</span>
              <p className="text-emerald-800 text-[11px] mt-0.5 leading-tight">
                Only patients with completed appointments on DigitalNexCare can submit verified public reviews.
              </p>
            </div>
          </div>
        </div>

        {notificationMsg && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            {notificationMsg}
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {rev.patientName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{rev.patientName}</h4>
                      {rev.verifiedVisit && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Verified Booking
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                      <div className="flex items-center text-amber-500">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <span>•</span>
                      <span>{rev.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!rev.providerResponse && activeReplyId !== rev.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveReplyId(rev.id)}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                    >
                      Reply to Patient
                    </Button>
                  )}
                  {activeAppealId !== rev.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-rose-600"
                      onClick={() => setActiveAppealId(rev.id)}
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                    >
                      Appeal
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed pl-12">
                "{rev.comment}"
              </p>

              {/* Existing Provider Response */}
              {rev.providerResponse && (
                <div className="ml-12 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Response from Dr. Naledi Mokoena
                    </span>
                    <span className="text-[11px]">{rev.providerResponse.respondedAt}</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {rev.providerResponse.text}
                  </p>
                </div>
              )}

              {/* Inline Reply Form */}
              {activeReplyId === rev.id && (
                <div className="ml-12 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Write public response as Practice Clinician:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Thank you for your feedback! We are dedicated to providing compassionate primary care..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#176BFF] focus:border-transparent"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveReplyId(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handlePostReply(rev.id)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Post Public Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Inline Appeal Form */}
              {activeAppealId === rev.id && (
                <div className="ml-12 p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                  <label className="text-xs font-bold text-rose-950 block">
                    File Review Dispute with Trust & Safety Team:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide specific justification (e.g. Unrelated defamatory content, competitor harassment, no consultation history)..."
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-rose-300 focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveAppealId(null);
                        setAppealReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleFileAppeal(rev.id)}
                      leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                    >
                      Submit Dispute Ticket
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </ProviderLayout>
  );
};
