
  import { EditorFormProps } from "@/lib/types";
  import { tailorSchema, TailorValues } from "@/lib/validation";
  import { zodResolver } from "@hookform/resolvers/zod";
  import { useEffect, useState } from "react";
  import { useForm } from "react-hook-form";
  import GenerateReviewInputButton from "./GenerateReviewInputButton";
  import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
  import { Textarea } from "@/components/ui/textarea";
  export default function TailorForm({
    resumeData,
    setResumeData,
  }: EditorFormProps) {
    const form = useForm<TailorValues>({
      resolver: zodResolver(tailorSchema),
      defaultValues: {
        resumeReview: {
          atsScore: resumeData.resumeReview?.atsScore || 0,
          overallAssessment: resumeData.resumeReview?.overallAssessment || "",
          strengths: resumeData.resumeReview?.strengths || "",
          areasForImprovement: resumeData.resumeReview?.areasForImprovement || "",
          recommendations: resumeData.resumeReview?.recommendations || "",
        },
      },
    });
    const [review,setReview] = useState<string>(""); 
    function handleReview(review : string){
        setReview(review);
    }
    useEffect(() => {
      const { unsubscribe } = form.watch(async (values) => {
        const isValid = await form.trigger();
        if (!isValid) return;
        setResumeData({ ...resumeData, resumeReview:{
          atsScore: values.resumeReview?.atsScore || 0,
          overallAssessment: values.resumeReview?.overallAssessment || "",
          strengths: values.resumeReview?.strengths || "",
          areasForImprovement: values.resumeReview?.areasForImprovement || "",
          recommendations: values.resumeReview?.recommendations || "",
          rationale: values.resumeReview?.rationale || "",
        }});
      });
      return unsubscribe;
    }, [form, resumeData, setResumeData]);
  
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-semibold">Professional summary</h2>
          <p className="text-sm text-muted-foreground">
            Write a short introduction for your resume or let the AI generate one
            from your entered data.
          </p>
        </div>
        <div>
        {review ? (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Generated Review:</h3>
          <p>{review}</p>
        </div>
      ) : <div className="mt-4 p-4 bg-gray-100 rounded-lg">
      <h3 className="font-semibold mb-2">Generated Review:</h3>
    </div>
      }
          <GenerateReviewInputButton
                    resumeData={resumeData}
                    onReviewGenerated={handleReview}
                  />
        </div>
        <Form {...form}>
        <form className="space-y-3">
          <FormField
            control={form.control}
            name="resumeReview.overallAssessment"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Professional overallAssessment</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="A brief, engaging text about yourself"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
      </div>
      
    );
  }
  