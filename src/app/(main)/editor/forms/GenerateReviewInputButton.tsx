import LoadingButton from "@/components/LoadingButton";
import { useToast } from "@/hooks/use-toast";
import usePremiumModal from "@/hooks/usePremiumModal";
import { canUseAITools } from "@/lib/permissions";
import { ResumeValues } from "@/lib/validation";
import { WandSparklesIcon } from "lucide-react";
import { useState } from "react";
import { useSubscriptionLevel } from "../../SubscriptionLevelProvider";
import { GenerateReview } from "./actions";

interface GenerateReviewInputButtonProps {
  resumeData: ResumeValues;
  onReviewGenerated: (summary: string) => void;
}

export default function GenerateReviewInputButton({
  resumeData,
  onReviewGenerated,
}: GenerateReviewInputButtonProps) {
  const subscriptionLevel = useSubscriptionLevel();

  const premiumModal = usePremiumModal();

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  async function handleClick() {
    //check user subscriptionLevel
    console.log(subscriptionLevel);
    if (!canUseAITools(subscriptionLevel)) {
      premiumModal.setOpen(true);
      return;
    }
    
    try {
      setLoading(true);
      const aiResponse = await GenerateReview(resumeData);
      onReviewGenerated(aiResponse);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <LoadingButton
      variant="outline"
      type="button"
      onClick={handleClick}
      loading={loading}
    >
      <WandSparklesIcon className="size-4" />
      Generate (AI)
    </LoadingButton>
  );
}
