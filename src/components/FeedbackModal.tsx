import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Star, Loader2, CheckCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationType: 'chat' | 'call' | 'symptom-check';
  sessionId?: string;
}

export function FeedbackModal({ isOpen, onClose, consultationType, sessionId }: FeedbackModalProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call (in real app, save to database)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Feedback submitted:', {
      consultationType,
      sessionId,
      rating,
      helpful,
      feedback,
    });

    setIsSuccess(true);
    toast({
      title: 'Thank you for your feedback!',
      description: 'Your feedback helps us improve our services.',
    });

    setTimeout(() => {
      onClose();
      // Reset state
      setRating(0);
      setHelpful(null);
      setFeedback('');
      setIsSuccess(false);
    }, 2000);
    
    setIsSubmitting(false);
  };

  const getTitle = () => {
    switch (consultationType) {
      case 'chat':
        return 'How was your chat experience?';
      case 'call':
        return 'How was your consultation?';
      case 'symptom-check':
        return 'Was the symptom check helpful?';
      default:
        return 'Share your feedback';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            Your feedback helps us improve our healthcare services
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-12 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-lg font-semibold">Thank You!</h3>
            <p className="text-muted-foreground mt-1">
              Your feedback has been recorded.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Star Rating */}
            <div className="space-y-2">
              <Label className="text-center block">Rate your experience</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        'h-8 w-8 transition-colors',
                        (hoveredRating || rating) >= star
                          ? 'fill-warning text-warning'
                          : 'text-muted-foreground'
                      )}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  {rating === 5 && 'Excellent!'}
                  {rating === 4 && 'Great!'}
                  {rating === 3 && 'Good'}
                  {rating === 2 && 'Fair'}
                  {rating === 1 && "We'll do better"}
                </p>
              )}
            </div>

            {/* Was it helpful? */}
            <div className="space-y-2">
              <Label className="text-center block">Was this helpful?</Label>
              <div className="flex justify-center gap-4">
                <Button
                  variant={helpful === true ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setHelpful(true)}
                  className={cn(
                    'gap-2',
                    helpful === true && 'bg-success hover:bg-success/90 border-0'
                  )}
                >
                  <ThumbsUp className="h-5 w-5" />
                  Yes
                </Button>
                <Button
                  variant={helpful === false ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setHelpful(false)}
                  className={cn(
                    'gap-2',
                    helpful === false && 'bg-destructive hover:bg-destructive/90 border-0'
                  )}
                >
                  <ThumbsDown className="h-5 w-5" />
                  No
                </Button>
              </div>
            </div>

            {/* Written Feedback */}
            <div className="space-y-2">
              <Label>Additional comments (optional)</Label>
              <Textarea
                placeholder="Tell us how we can improve..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Skip
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                className="flex-1 gradient-primary border-0"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Submit'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
