"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
// import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Phone,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import styles from "@/styles/CybersecurityAssessmentForm.module.css";
import { questionsData, Question } from '@/lib/questions';
import { computeAssessment, type AssessmentResult } from "@/lib/scoring";

// Add this near the top of the file, before the component
const BLOCKED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "aol.com",
  "icloud.com",
  "mail.com",
];


export function CybersecurityAssessmentForm() {
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    company: "",
    position: "",
    phone: "",
    website: "",
  });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0); // animates TOTAL score percentage (for UI only)
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [questions] = useState<Question[]>(questionsData);
  // Filter out q5 (VAT question) from questions array since it's shown separately
  const [assessmentQuestions] = useState<Question[]>(questionsData.filter(q => q.id !== 'q5'));
  const TOTAL_QUESTIONS = assessmentQuestions.length; // Total number of questions (excluding VAT question)
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [isSubmittingConsultation, setIsSubmittingConsultation] = useState(false);
  const [consultationSuccess, setConsultationSuccess] = useState(false);
  const [consultationError, setConsultationError] = useState<string | null>(null);
  const [showVatQuestion, setShowVatQuestion] = useState(false);
  const [isOutOfScope, setIsOutOfScope] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2, { 
      message: "Please enter a valid name." 
    }),
    email: z.string().email("Please enter a valid email address").refine((email) => {
      if (!email.includes("@")) return false;
      const [, domain] = email.split("@");
      return domain && !BLOCKED_EMAIL_DOMAINS.includes(domain.toLowerCase());
    }, "Please use your business email address."),
    company: z.string().min(2, { 
      message: "Company legal name cannot be empty." 
    }),
    position: z.string().min(2, { 
      message: "Please enter a valid position." 
    }),
    phone: z.union([
      z.string().max(25, { message: "Contact number is too long." }),
      z.literal(""),
    ]),
    website: z.string().min(2, { message: "Please enter a website." }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      position: "",
      phone: "",
      website: "",
    },
    mode: "onSubmit"
  });

  useEffect(() => {
    if (isConsultationModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isConsultationModalOpen]);

  const consultationSchema = z.object({
    firstName: z.string().min(2, { message: "Please enter a valid first name." }),
    lastName: z.string().min(2, { message: "Please enter a valid last name." }),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().max(20, { message: "Phone number is too long." }).optional(),
  });

  const consultationForm = useForm<z.infer<typeof consultationSchema>>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Auto-fill consultation form when modal opens
  useEffect(() => {
    if (isConsultationModalOpen && personalInfo.name && personalInfo.email) {
      const nameParts = personalInfo.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      consultationForm.reset({
        firstName: firstName,
        lastName: lastName,
        email: personalInfo.email,
        phone: "",
      });
    }
  }, [isConsultationModalOpen, personalInfo, consultationForm]);

  const handlePersonalInfoSubmit = (values: z.infer<typeof formSchema>) => {
    setPersonalInfo(values);
    setShowVatQuestion(true); // Show VAT question after personal info
  };

  const handleVatAnswer = (value: string) => {
    const updatedAnswers = { ...answers, q5: value };
    setAnswers(updatedAnswers);
    if (value === '0') {
      // Not registered for VAT - show out of scope thank you page
      setIsOutOfScope(true);
    } else {
      // Registered for VAT - proceed to assessment questions
      // Auto-advance after a short delay for better UX
      setTimeout(() => {
        setShowVatQuestion(false);
        setCurrentQuestion(1); // Move to the first assessment question
      }, 300);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    setAnswers(updatedAnswers);
    
    // Get current question to check response type
    const currentQ = assessmentQuestions[currentQuestion - 1];
    
    // Only auto-advance for yesno and select types, not for text, number, or multiselect
    if (currentQ && (currentQ.responseType === 'yesno' || currentQ.responseType === 'select')) {
      // Automatically advance to next question after a short delay for yes/no and select questions
      setTimeout(() => {
        if (currentQuestion < TOTAL_QUESTIONS) {
          setFormErrors([]);
          setCurrentQuestion(currentQuestion + 1);
        } else if (currentQuestion === TOTAL_QUESTIONS) {
          // If this is the last question, calculate score with updated answers
          calculateScoreWithAnswers(updatedAnswers);
        }
      }, 300); // Small delay to allow UI to update
    }
    // For text, number, multiselect, and ynlist - user must click Next button manually
  };

  const calculateScoreWithAnswers = async (finalAnswers: Record<string, string>) => {
    const result = computeAssessment(finalAnswers);
    setAssessment(result);
    setAnimatedScore(0);

    const maxTotal = result.maxUrgencyScore + result.maxComplexityScore;
    const percentageScore = maxTotal > 0 ? Math.round((result.totalScore / maxTotal) * 100) : 0;

    // Animate the score
    const animationDuration = 1000; // 1 second
    const frameDuration = 1000 / 60; // 60 fps
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;
    const animate = () => {
      const progress = frame / totalFrames;
      setAnimatedScore(Math.floor(progress * percentageScore));
      if (frame < totalFrames) {
        frame++;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    // Prepare the data to be sent via API
    const assessmentData = {
      personalInfo: {
        name: personalInfo.name,
        email: personalInfo.email,
        company: personalInfo.company,
        position: personalInfo.position,
        phone: personalInfo.phone,
        website: personalInfo.website,
      },
      answers: finalAnswers,
      score: result.totalScore,
      assessment: result,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    };

    // Send the data to the server
    try {
      const response = await fetch("/api/send-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to send assessment results"
        );
      }

      const data = await response.json();
      console.log("Assessment results sent successfully:", data);
    } catch (error) {
      console.error("Error sending assessment results:", error);
    }
  };

  const handleNext = () => {
    if (currentQuestion === 0) {
      form.handleSubmit(handlePersonalInfoSubmit)();
    } else if (currentQuestion < TOTAL_QUESTIONS) {
      const currentQ = assessmentQuestions[currentQuestion - 1];
      const currentAnswer = answers[currentQ.id];
      
      // Validate based on response type
      if (!currentAnswer || (typeof currentAnswer === 'string' && currentAnswer.trim() === '')) {
        setFormErrors(["Please provide an answer before proceeding."]);
        return;
      }
      
      // Additional validation for number type
      if (currentQ.responseType === 'number') {
        const numValue = parseFloat(currentAnswer);
        if (isNaN(numValue)) {
          setFormErrors(["Please enter a valid number."]);
          return;
        }
        if (currentQ.validation?.min !== undefined && numValue < currentQ.validation.min) {
          setFormErrors([`Please enter a number greater than or equal to ${currentQ.validation.min}.`]);
          return;
        }
        if (currentQ.validation?.max !== undefined && numValue > currentQ.validation.max) {
          setFormErrors([`Please enter a number less than or equal to ${currentQ.validation.max}.`]);
          return;
        }
      }
      
      // Validation for Y/N list - at least one option should be answered
      if (currentQ.responseType === 'ynlist') {
        try {
          const ynAnswers = JSON.parse(currentAnswer);
          const hasAnswer = Object.values(ynAnswers).some(v => v === 'Yes' || v === 'No');
          if (!hasAnswer) {
            setFormErrors(["Please answer at least one option."]);
            return;
          }
        } catch (e) {
          setFormErrors(["Please answer at least one option."]);
          return;
        }
      }
      
      setFormErrors([]);
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // This is the last question - ensure the answer is saved before calculating score
      const currentQ = assessmentQuestions[currentQuestion - 1];
      const currentAnswer = answers[currentQ.id];
      
      // Validate the last answer
      if (!currentAnswer || (typeof currentAnswer === 'string' && currentAnswer.trim() === '')) {
        setFormErrors(["Please provide an answer before finishing."]);
        return;
      }
      
      // Additional validation for number type
      if (currentQ.responseType === 'number') {
        const numValue = parseFloat(currentAnswer);
        if (isNaN(numValue)) {
          setFormErrors(["Please enter a valid number."]);
          return;
        }
        if (currentQ.validation?.min !== undefined && numValue < currentQ.validation.min) {
          setFormErrors([`Please enter a number greater than or equal to ${currentQ.validation.min}.`]);
          return;
        }
        if (currentQ.validation?.max !== undefined && numValue > currentQ.validation.max) {
          setFormErrors([`Please enter a number less than or equal to ${currentQ.validation.max}.`]);
          return;
        }
      }
      
      // Validation for Y/N list
      if (currentQ.responseType === 'ynlist') {
        try {
          const ynAnswers = JSON.parse(currentAnswer);
          const hasAnswer = Object.values(ynAnswers).some(v => v === 'Yes' || v === 'No');
          if (!hasAnswer) {
            setFormErrors(["Please answer at least one option."]);
            return;
          }
        } catch (e) {
          setFormErrors(["Please answer at least one option."]);
          return;
        }
      }
      
      setFormErrors([]);
      calculateScore();
    }
  };

  const calculateScore = async () => {
    // Use current answers state - ensure we have the latest answer
    // Get the current question's answer if it exists
    const currentQ = assessmentQuestions[currentQuestion - 1];
    let finalAnswers = { ...answers };
    
    // If we're on the last question, make sure its answer is included
    if (currentQ && currentQuestion === TOTAL_QUESTIONS) {
      const lastAnswer = answers[currentQ.id];
      if (lastAnswer !== undefined && lastAnswer !== null) {
        finalAnswers[currentQ.id] = lastAnswer;
      }
    }
    
    const result = computeAssessment(finalAnswers);
    setAssessment(result);
    setAnimatedScore(0);

    const maxTotal = result.maxUrgencyScore + result.maxComplexityScore;
    const percentageScore = maxTotal > 0 ? Math.round((result.totalScore / maxTotal) * 100) : 0;

    // Animate the score
    const animationDuration = 1000; // 1 second
    const frameDuration = 1000 / 60; // 60 fps
    const totalFrames = Math.round(animationDuration / frameDuration);
    let frame = 0;
    const animate = () => {
      const progress = frame / totalFrames;
      setAnimatedScore(Math.floor(progress * percentageScore));
      if (frame < totalFrames) {
        frame++;
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);

    // Prepare the data to be sent via API
    const assessmentData = {
      personalInfo: {
        name: personalInfo.name,
        email: personalInfo.email,
        company: personalInfo.company,
        position: personalInfo.position,
        phone: personalInfo.phone,
        website: personalInfo.website,
      },
      answers: finalAnswers,
      score: result.totalScore,
      assessment: result,
      origin: typeof window !== 'undefined' ? window.location.origin : '',
    };

    // Send the data to the server
    try {
      const response = await fetch("/api/send-assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to send assessment results"
        );
      }

      const data = await response.json();
      console.log("Assessment results sent successfully:", data);
    } catch (error) {
      console.error("Error sending assessment results:", error);
    }
  };

  const progress = ((currentQuestion + 1) / (TOTAL_QUESTIONS + 1)) * 100;

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // const getScoreColor = (score: number) => {
  //   if (score >= 85) return "text-green-500";
  //   if (score >= 65) return "text-yellow-500";
  //   if (score >= 35) return "text-orange-500";
  //   return "text-red-500";
  // };


  const handleConsultationSubmit = async (values: z.infer<typeof consultationSchema>) => {
    setConsultationError(null);
    setIsSubmittingConsultation(true);
    try {
      const response = await fetch("/api/book-consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          context: {
            personalInfo,
            score: assessment?.totalScore ?? Math.round(animatedScore),
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to submit consultation request.");
      }

      consultationForm.reset();
      setConsultationSuccess(true);
      setIsConsultationModalOpen(false);
    } catch (error) {
      console.error("Error submitting consultation form:", error);
      setConsultationError(
        error instanceof Error ? error.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmittingConsultation(false);
    }
  };

  // Show out of scope thank you page
  if (isOutOfScope) {
    return (
      <div className="min-h-screen relative">
        <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/Frame%201171276000.png"
            alt="RSM Header"
            width={1920}
            height={200}
            className="block w-full h-auto"
            priority
          />
        </section>
        <section className="relative pb-16">
          <div className="relative mx-auto mt-12 max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
            <Card className="rounded-3xl border border-[#00AEEF]/20 bg-white shadow-[0_25px_70px_rgba(2,48,89,0.12)]">
              <CardHeader className="space-y-2 text-center relative px-4 sm:px-6 pt-8 sm:pt-10 pb-4 sm:pb-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="flex justify-center mb-6"
                >
                  <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#00AEEF]/10 border-2 border-[#00AEEF]">
                    <Check className="h-10 w-10 sm:h-12 sm:w-12 text-[#00AEEF]" strokeWidth={3} />
                  </div>
                </motion.div>
                <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1b3a57] mb-2">
                  Thank You!
                </CardTitle>
                <p className="text-sm sm:text-base text-gray-600">
                  Your assessment has been received
                </p>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 pb-6 sm:pb-8 pt-2">
                <div className="space-y-6">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="rounded-2xl border border-[#00AEEF]/30 bg-gradient-to-r from-[#e6f5fc] to-[#d0ebf7] px-6 py-6"
                  >
                    <p className="text-lg sm:text-xl font-semibold text-[#1b3a57] mb-4 text-center">
                      Your Business is Out of Scope
                    </p>
                    <div className="space-y-3 text-left">
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        Based on your response, your business is not currently registered for VAT in the UAE. As a result, you are out of scope for the UAE E-Invoicing mandate at this time.
                      </p>
                      <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                        The UAE E-Invoicing mandate applies to businesses registered for VAT. If your business becomes VAT-registered in the future, you may need to comply with the e-invoicing requirements.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-center space-y-4"
                  >
                    <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                      Thank you, <span className="font-semibold text-[#1b3a57]">{personalInfo.name}</span>, for taking the time to complete this assessment for <span className="font-semibold text-[#1b3a57]">{personalInfo.company}</span>.
                    </p>
                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                      If you have any questions or would like to learn more about UAE E-Invoicing requirements, please feel free to contact us at{" "}
                      <a
                        href="mailto:e-invoice-inquiry@rsm.ae"
                        className="font-semibold text-[#00AEEF] hover:underline"
                      >
                        e-invoice-inquiry@rsm.ae
                      </a>
                    </p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    );
  }

  // Show VAT question after personal info
  if (showVatQuestion) {
    const vatQuestion = questionsData.find(q => q.id === 'q5');
    const vatAnswer = answers.q5 || '';
    
    return (
      <div className="min-h-screen relative">
        <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/Frame%201171276000.png"
            alt="RSM Header"
            width={1920}
            height={200}
            className="block w-full h-auto"
            priority
          />
        </section>
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 py-10 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-3xl border-2 border-[#00AEEF] bg-white/95 backdrop-blur shadow-[0_25px_70px_rgba(3,32,66,0.25)]">
              <CardHeader className="border-b border-gray-100 px-6 py-6 relative">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00AEEF]">
                    Eligibility Question
                  </span>
                  <CardTitle className="text-xl font-semibold leading-snug text-[#1b3a57] sm:text-2xl">
                    {vatQuestion?.text}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 py-6">
                <div className="flex flex-col gap-4">
                  {vatQuestion?.options?.map((option) => {
                    const id = `vat-${option.value}`;
                    const isSelected = vatAnswer === option.value;
                    return (
                      <div key={option.value} className="flex-1">
                        <input
                          type="radio"
                          id={id}
                          name="vat-question"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => {
                            handleVatAnswer(option.value);
                            // Auto-advance if "Yes" is selected
                            if (option.value === '1') {
                              setFormErrors([]);
                            }
                          }}
                          className="sr-only"
                          required
                        />
                        <Label
                          htmlFor={id}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none cursor-pointer",
                            option.value === "1" && "border border-[#3F9C35]",
                            option.value === "0" && "border border-[#00AEEF]",
                            !isSelected && option.value === "1" && "hover:border-[#3F9C35] hover:shadow-lg",
                            !isSelected && option.value === "0" && "hover:border-[#00AEEF] hover:shadow-lg",
                            isSelected && option.value === "1" &&
                              "border-[#3F9C35] bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)] hover:shadow-[0_12px_30px_rgba(34,197,94,0.3)]",
                            isSelected && option.value === "0" &&
                              "border-[#00AEEF] bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-[0_12px_30px_rgba(239,68,68,0.22)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.3)]",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 transition-colors",
                              isSelected && option.value === "1" && "border-white bg-white",
                              isSelected && option.value === "0" && "border-white bg-white",
                            )}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 transition-opacity",
                                isSelected && option.value === "1" && "text-[#22c55e] opacity-100",
                                isSelected && option.value === "0" && "text-[#ef4444] opacity-100",
                                !isSelected && "opacity-0",
                              )}
                            />
                          </span>
                          <span className={cn(
                            "flex-1 text-left",
                            isSelected && "text-white font-semibold",
                          )}>{option.label}</span>
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {formErrors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                  >
                    {formErrors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (currentQuestion === 0) {
    return (
      <div className="min-h-screen relative">
        <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/Frame%201171276000.png"
            alt="RSM Header"
            width={1920}
            height={200}
            className="block w-full h-auto"
            priority
          />
        </section>
        <section className="relative pb-16">
          <div className="relative mx-auto mt-12 max-w-4xl px-4 sm:px-6 lg:px-8 space-y-6">
              <Card className="rounded-3xl border-2 border-[#3F9C35] bg-white shadow-[0_25px_70px_rgba(2,48,89,0.12)]">
                  <CardHeader className="space-y-2 text-center relative px-6 pt-6 pb-4">
                    <CardTitle className="text-2xl font-semibold text-[#1b3a57] sm:text-3xl">
                        Business Information
                      </CardTitle>
                  <CardDescription className="text-base text-gray-500">
                        Please provide your information before starting the assessment
                      </CardDescription>
                    </CardHeader>
              <CardContent className="pt-2">
                      <Form {...form}>
                        <form
                          onSubmit={form.handleSubmit(handlePersonalInfoSubmit)}
                          className="space-y-6"
                        >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your name"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.name &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Business Email <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                type="email"
                                placeholder="your.email@company.com"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.email &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="company"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Company Legal Name <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your company legal name"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.company &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                            <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                              Position <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                placeholder="Enter your job title"
                                      className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                  form.formState.submitCount > 0 &&
                                    form.formState.errors.position &&
                                    "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                    Contact Number
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="tel"
                                      placeholder="Enter your contact number (optional)"
                                      className={cn(
                                        "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                        form.formState.submitCount > 0 &&
                                          form.formState.errors.phone &&
                                          "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="website"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                    Website <span className="text-red-500">*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      placeholder="example.com"
                                      className={cn(
                                        "h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]",
                                        form.formState.submitCount > 0 &&
                                          form.formState.errors.website &&
                                          "border-red-500 focus-visible:ring-red-500",
                                      )}
                                    />
                                  </FormControl>
                                  {form.formState.submitCount > 0 && <FormMessage />}
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                      className="flex h-12 w-full items-center justify-center rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf]"
                          >
                      Continue to Questions
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
          </div>
        </section>
        
        {/* Bottom Right Image - Visible when scrolling to bottom */}
        {/* <div className="absolute bottom-0 right-0 m-0 p-0 z-[-1]">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20Kuwait%20ESG/Screenshot_2025-08-18_at_4.19.40_PM-removebg-preview.png"
            alt="RSM Assessment Footer"
            width={500}
            height={400}
            className="max-w-full h-auto mr[-100px] p-0"
            style={{ margin: 0, padding: 0 }}
          />
        </div> */}
      </div>
    );
  }

  return (
      <div className="min-h-screen relative">
      <section className="relative left-1/2 right-1/2 w-screen -translate-x-1/2">
        <Image
          src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM/Frame%201171276000.png"
          alt="RSM Header"
          width={1920}
          height={200}
          className="block w-full h-auto"
          priority
        />
      </section>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-2 py-10 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {assessment === null ? (
                <motion.div
                  key={`question-${currentQuestion}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-2 border-[#00AEEF] bg-white/95 backdrop-blur shadow-[0_25px_70px_rgba(3,32,66,0.25)]">
                <CardHeader className="border-b border-gray-100 px-6 py-6 relative">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#00AEEF]">
                      Question {currentQuestion} of {TOTAL_QUESTIONS}
                    </span>
                    <CardTitle className="text-xl font-semibold leading-snug text-[#1b3a57] sm:text-2xl">
                      {assessmentQuestions[currentQuestion - 1].text}
                      </CardTitle>
                  </div>
                    </CardHeader>
                <CardContent className="px-6 py-6">
                  {(() => {
                    const currentQ = assessmentQuestions[currentQuestion - 1];
                    const currentAnswer = answers[currentQ.id] || '';
                    
                    // Render based on response type
                    if (currentQ.responseType === 'yesno' || currentQ.responseType === 'select') {
                      return (
                        <div className="flex flex-col gap-4">
                          {currentQ.options?.map((option) => {
                            const id = `${currentQ.id}-${option.value}`;
                            const isSelected = currentAnswer === option.value;
                            return (
                              <div key={option.value} className="flex-1">
                                <input
                                  type="radio"
                                  id={id}
                                  name={currentQ.id}
                                  value={option.value}
                                  checked={isSelected}
                                  onChange={() => handleAnswerChange(currentQ.id, option.value)}
                                  className="sr-only"
                                  required
                                />
                                <Label
                                  htmlFor={id}
                                  className={cn(
                                    "flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none cursor-pointer",
                                      option.value === "1" && "border border-[#3F9C35]",
                                      option.value === "0" && "border border-[#00AEEF]",
                                    !isSelected && option.value === "1" && "hover:border-[#3F9C35] hover:shadow-lg",
                                    !isSelected && option.value === "0" && "hover:border-[#00AEEF] hover:shadow-lg",
                                    isSelected && option.value === "1" &&
                                      "border-[#3F9C35] bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white shadow-[0_12px_30px_rgba(34,197,94,0.22)] hover:shadow-[0_12px_30px_rgba(34,197,94,0.3)]",
                                    isSelected && option.value === "0" &&
                                      "border-[#00AEEF] bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white shadow-[0_12px_30px_rgba(239,68,68,0.22)] hover:shadow-[0_12px_30px_rgba(239,68,68,0.3)]",
                                    isSelected && option.value !== "1" && option.value !== "0" &&
                                      "border-[#00AEEF] bg-gradient-to-r from-[#00AEEF] to-[#0091cf] text-white shadow-[0_12px_30px_rgba(0,174,239,0.22)]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-300 transition-colors",
                                      isSelected && option.value === "1" && "border-white bg-white",
                                      isSelected && option.value === "0" && "border-white bg-white",
                                      isSelected && option.value !== "1" && option.value !== "0" && "border-white bg-white",
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "h-3.5 w-3.5 transition-opacity",
                                        isSelected && option.value === "1" && "text-[#22c55e] opacity-100",
                                        isSelected && option.value === "0" && "text-[#ef4444] opacity-100",
                                        isSelected && option.value !== "1" && option.value !== "0" && "text-[#00AEEF] opacity-100",
                                        !isSelected && "opacity-0",
                                      )}
                                    />
                                  </span>
                                  <span className={cn(
                                    "flex-1 text-left",
                                    isSelected && "text-white font-semibold",
                                  )}>{option.label}</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (currentQ.responseType === 'text') {
                      return (
                        <div>
                          <textarea
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                            placeholder={currentQ.placeholder || "Please provide your answer"}
                            className="w-full min-h-[120px] rounded-xl border border-gray-200 bg-white px-4 py-3 text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF] focus-visible:outline-none resize-y"
                            required
                          />
                        </div>
                      );
                    } else if (currentQ.responseType === 'number') {
                      return (
                        <div>
                          <Input
                            type="number"
                            value={currentAnswer}
                            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                            placeholder={currentQ.placeholder || "Enter number"}
                            min={currentQ.validation?.min}
                            max={currentQ.validation?.max}
                            className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                            required
                          />
                        </div>
                      );
                    } else if (currentQ.responseType === 'ynlist') {
                      // Y/N list - checkboxes with Yes/No for each option
                      const ynAnswers = typeof currentAnswer === 'string' && currentAnswer ? JSON.parse(currentAnswer) : {};
                      return (
                        <div className="space-y-3">
                          {currentQ.options?.map((option) => {
                            const optionAnswer = ynAnswers[option.value] || '';
                            return (
                              <div key={option.value} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
                                <span className="text-sm font-medium text-gray-700">{option.label}</span>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAnswers = { ...ynAnswers, [option.value]: 'Yes' };
                                      handleAnswerChange(currentQ.id, JSON.stringify(newAnswers));
                                    }}
                                    className={cn(
                                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                      optionAnswer === 'Yes'
                                        ? "bg-[#3F9C35] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAnswers = { ...ynAnswers, [option.value]: 'No' };
                                      handleAnswerChange(currentQ.id, JSON.stringify(newAnswers));
                                    }}
                                    className={cn(
                                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                                      optionAnswer === 'No'
                                        ? "bg-[#ef4444] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                  >
                                    No
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    } else if (currentQ.responseType === 'multiselect') {
                      // Multi-select - styled like other options but allows multiple selection
                      const selectedValues = typeof currentAnswer === 'string' && currentAnswer ? currentAnswer.split(',').filter(Boolean) : [];
                      return (
                        <div className="flex flex-col gap-4">
                          {currentQ.options?.map((option) => {
                            const id = `${currentQ.id}-${option.value}`;
                            const isSelected = selectedValues.includes(option.value);
                            return (
                              <div key={option.value} className="flex-1">
                                <input
                                  type="checkbox"
                                  id={id}
                                  name={currentQ.id}
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const newValues = e.target.checked
                                      ? [...selectedValues, option.value]
                                      : selectedValues.filter(v => v !== option.value);
                                    handleAnswerChange(currentQ.id, newValues.join(','));
                                  }}
                                  className="sr-only"
                                />
                                <Label
                                  htmlFor={id}
                                  className={cn(
                                    "flex w-full items-center gap-4 rounded-2xl border bg-white px-5 py-4 text-sm font-medium text-gray-700 shadow-sm transition-all focus:outline-none cursor-pointer",
                                    !isSelected && "hover:border-[#00AEEF] hover:shadow-lg border-gray-200",
                                    isSelected &&
                                      "border-[#00AEEF] bg-gradient-to-r from-[#00AEEF] to-[#0091cf] text-white shadow-[0_12px_30px_rgba(0,174,239,0.22)]",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                                      isSelected ? "border-white bg-white" : "border-gray-300",
                                    )}
                                  >
                                    <Check
                                      className={cn(
                                        "h-3.5 w-3.5 transition-opacity",
                                        isSelected && "text-[#00AEEF] opacity-100",
                                        !isSelected && "opacity-0",
                                      )}
                                    />
                                  </span>
                                  <span className={cn(
                                    "flex-1 text-left",
                                    isSelected && "text-white font-semibold",
                                  )}>{option.label}</span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }
                    return null;
                  })()}
                        {formErrors.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                      className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                          >
                            {formErrors.map((error, index) => (
                              <p key={index}>{error}</p>
                            ))}
                          </motion.div>
                        )}
                    </CardContent>
                <CardFooter className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:justify-between">
                      <Button
                        onClick={handleBack}
                        disabled={currentQuestion === 1}
                    className="h-11 w-full rounded-full border border-gray-200 bg-white text-sm font-semibold text-[#1b3a57] transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 sm:w-[200px]"
                      >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        onClick={handleNext}
                    className="h-11 w-full rounded-full bg-[#00AEEF] text-sm font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] sm:w-[220px]"
                  >
                    {currentQuestion === TOTAL_QUESTIONS ? "Finish" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
              initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-3xl border-0 bg-white/95 backdrop-blur shadow-[0_25px_70px_rgba(3,32,66,0.25)]">
                <CardHeader className="px-6 py-6">
                  <div className="flex items-center justify-center">
                    <CardTitle className="text-3xl font-semibold text-[#1b3a57] text-center">
                      Assessment Results
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className={cn(styles.resultContainer, "px-6 pb-10 pt-2")}>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-8 px-6 py-5 text-center"
                      >
                        <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                          Thank you <span className="font-semibold text-[#1b3a57]">{personalInfo.name}</span> for completing the e-invoicing mandate &amp; readiness assessment for <span className="font-semibold text-[#1b3a57]">{personalInfo.company}</span> on <span className="font-semibold text-[#1b3a57]">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>.
                        </p>
                      </motion.div>

                      {/* Phase recommendation - derived from computed score (Axis A urgency) */}
                      {assessment?.eligible !== false && assessment && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.5 }}
                          className="mt-4 px-6 py-3"
                        >
                          <div className="rounded-2xl border-2 border-[#00AEEF] bg-gradient-to-r from-[#e6f5fc] to-[#d0ebf7] px-6 py-5 shadow-md">
                            {assessment.urgency.score >= 18 ? (
                              <div className="text-center">
                                <div className="mb-3">
                                  <span className="bg-[#00AEEF] text-white px-3 py-1.5 rounded-md font-bold text-sm">Phase 1:</span>
                                </div>
                                <p className="text-base font-semibold text-[#1b3a57]">
                                  Contact RSM to schedule a meeting to assess your technical and compliance readiness for Phase 1{" "}
                                  <span className="bg-yellow-200 px-2 py-0.5 rounded font-semibold text-sm">(critical priority)</span>.
                                </p>
                              </div>
                            ) : assessment.urgency.score >= 10 ? (
                              <div className="text-center">
                                <div className="mb-3">
                                  <span className="bg-[#00AEEF] text-white px-3 py-1.5 rounded-md font-bold text-sm">Phase 2:</span>
                                </div>
                                <p className="text-base font-semibold text-[#1b3a57]">
                                  Start planning for Phase 2 compliance{" "}
                                  <span className="bg-yellow-200 px-2 py-0.5 rounded font-semibold text-sm">(2027+)</span> and engage with a solution provider.
                                </p>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="mb-3">
                                  <span className="bg-[#1b3a57] text-white px-3 py-1.5 rounded-md font-bold text-sm">Low Priority:</span>
                                </div>
                                <p className="text-base font-semibold text-[#1b3a57]">
                                  Monitor regulatory updates and prepare when required. No immediate Phase 1/2 action is indicated by your current urgency score.
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {assessment?.eligible === false && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.5 }}
                          className="mt-4 px-6 py-4 text-center"
                        >
                          <div className="rounded-2xl border border-[#ef4444]/30 bg-gradient-to-r from-[#fff1f2] to-[#ffe4e6] px-6 py-4">
                            <p className="text-base sm:text-lg font-semibold text-[#1b3a57] mb-2">
                              Out of Scope for Scoring
                            </p>
                            <p className="text-sm sm:text-base text-gray-700">
                              {assessment.ineligibleReason}
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {assessment?.eligible !== false && assessment && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.45, duration: 0.5 }}
                          className="mt-4 px-6 py-4"
                        >
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-[#00AEEF]/20 bg-white px-6 py-4">
                              <p className="text-sm font-semibold text-[#1b3a57] mb-1">Axis A — Mandate Urgency</p>
                              <p className="text-2xl font-semibold text-[#009cde]">
                                {assessment.urgency.score} / {assessment.maxUrgencyScore}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#1b3a57]">{assessment.urgency.category}</p>
                              <p className="mt-1 text-sm text-gray-700">{assessment.urgency.recommendation}</p>
                            </div>
                            <div className="rounded-2xl border border-[#3F9C35]/20 bg-white px-6 py-4">
                              <p className="text-sm font-semibold text-[#1b3a57] mb-1">Axis B — Implementation Complexity</p>
                              <p className="text-2xl font-semibold text-[#3F9C35]">
                                {assessment.complexity.score} / {assessment.maxComplexityScore}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-[#1b3a57]">{assessment.complexity.category}</p>
                              <p className="mt-1 text-sm text-gray-700">{assessment.complexity.recommendation}</p>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        className="mt-4 px-6 py-4 text-center"
                      >
                        <div className="rounded-2xl border border-[#009cde]/30 bg-gradient-to-r from-[#e6f5fc] to-[#d0ebf7] px-6 py-4">
                          <p className="text-base sm:text-lg font-semibold text-[#1b3a57] mb-2">
                            Your Report is on the Way!
                          </p>
                          <p className="text-sm sm:text-base text-gray-700">
                            Your detailed assessment report will be sent to <span className="font-semibold text-[#009cde]">{personalInfo.email}</span> shortly. Please check your inbox for the complete PDF report.
                          </p>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55, duration: 0.5 }}
                        className="mt-4 px-6 py-4 text-center"
                      >
                        <p className="text-sm sm:text-base text-gray-700">
                          If you have any questions or would like to learn more about UAE E-Invoicing requirements, please feel free to contact us at <a href="mailto:e-invoice-inquiry@rsm.ae" className="font-semibold text-[#009cde] hover:underline">e-invoice-inquiry@rsm.ae</a>.
                        </p>
                      </motion.div>

                      {!isConsultationModalOpen && consultationSuccess && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 rounded-2xl border border-[#3F9C35]/30 bg-gradient-to-r from-[#f0fbf4] to-[#e6f5ed] px-6 py-5 text-center text-[#1b3a57]"
                        >
                          <p className="text-lg font-semibold text-[#1b3a57]">
                            Thank you for reaching out! 🎉
                          </p>
                          <p className="mt-2 text-sm text-gray-700">
                            Our consulting team has received your request and will get back to you
                            shortly with available consultation slots. A confirmation email is on its
                            way to your inbox.
                          </p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
            {assessment === null && (
              <motion.div
            className="rounded-3xl border-2 border-[#3F9C35] bg-white/80 px-6 py-5 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
              >
            <div className="relative h-2 overflow-hidden rounded-full bg-[#EAF6FB]">
                  <motion.div
                className="absolute left-0 top-0 h-full rounded-full bg-[#009CD9]"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6 }}
              />
                </div>
              </motion.div>
            )}
      </div>
      
      {/* Bottom Right Image - Visible when scrolling to bottom */}
      {/* <div className="relative w-full m-0 p-0">
        <div className="flex justify-end m-0 p-0">
          <Image
            src="https://22527425.fs1.hubspotusercontent-na2.net/hubfs/22527425/RSM%20Kuwait%20ESG/Screenshot_2025-08-18_at_4.19.40_PM-removebg-preview.png"
            alt="RSM Assessment Footer"
            width={500}
            height={400}
            className="max-w-full h-auto m-0 p-0"
          />
        </div>
      </div> */}
      
      <AnimatePresence>
        {isConsultationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4 py-8"
            aria-modal="true"
            role="dialog"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl"
            >
              <Card className="border border-[#00AEEF]/20 bg-white shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
                <CardHeader className="px-6 pt-6 pb-2 text-center relative">
                  <button
                    onClick={() => {
                      setIsConsultationModalOpen(false);
                      setConsultationError(null);
                    }}
                    className="absolute right-4 top-4 rounded-full border border-gray-200 bg-white p-1 text-gray-500 transition hover:text-gray-800"
                    aria-label="Close consultation form"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <CardTitle className="flex items-center justify-center gap-2 text-2xl font-semibold text-[#1b3a57]">
                    <UserRound className="h-6 w-6 text-[#00AEEF]" />
                    Book a Consultation
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Share a few details and our team will reach out with available slots.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <Form {...consultationForm}>
                    <form
                      onSubmit={consultationForm.handleSubmit(handleConsultationSubmit)}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                          control={consultationForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                First Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter first name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Last Name <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter last name"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Email <span className="text-red-500">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="your.email@company.com"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={consultationForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-[#1b3a57]">
                                Phone Number
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="tel"
                                  placeholder="+971 5X XXX XXXX"
                                  className="h-12 rounded-xl border-gray-200 bg-white text-base focus-visible:ring-2 focus-visible:ring-[#00AEEF]"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {consultationError && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                          {consultationError}
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={isSubmittingConsultation}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#00AEEF] text-base font-semibold text-white shadow-lg shadow-[#00AEEF]/30 transition-colors hover:bg-[#0091cf] disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <Phone className="h-5 w-5" />
                        {isSubmittingConsultation ? "Sending..." : "Submit Request"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

