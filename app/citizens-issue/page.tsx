"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ReCAPTCHA from "react-google-recaptcha";

const issueTypes = [
  "road",
  "drain",
  "streetlight",
  "garbage",
  "cleaning",
  "lake",
  "police",
  "traffic",
  "others"
];

export default function CitizensIssuePage() {
  const [formData, setFormData] = useState({
    issueName: "",
    location: "",
    startDate: "",
    type: "",
    complainantName: "",
    email: "",
    phone: "",
    photoLink: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setSubmitStatus("error");
      setErrorMessage("Please complete the CAPTCHA verification");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    try {
      const response = await fetch("/api/citizens-issue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, captchaToken }),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({
          issueName: "",
          location: "",
          startDate: "",
          type: "",
          complainantName: "",
          email: "",
          phone: "",
          photoLink: "",
          description: ""
        });
        recaptchaRef.current?.reset();
        setCaptchaToken(null);
      } else {
        const error = await response.text();
        setSubmitStatus("error");
        setErrorMessage(error || "Failed to submit issue");
      }
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Citizens Issue Box</h1>
        <p className="mt-2 text-xl font-semibold text-primary">[Civic Opposition of India]</p>
        <p className="mt-4 text-lg text-muted-foreground">
          Submit your grievances and we'll raise them with the relevant authorities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report an Issue</CardTitle>
          <CardDescription>
            Please provide accurate details to help us address your concern effectively.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="issueName" className="block text-sm font-medium mb-2">
                  Issue Name *
                </label>
                <Input
                  id="issueName"
                  type="text"
                  required
                  value={formData.issueName}
                  onChange={(e) => handleInputChange("issueName", e.target.value)}
                  placeholder="Brief title of the issue"
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium mb-2">
                  Location *
                </label>
                <Input
                  id="location"
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="Area or address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium mb-2">
                  Issue Start Date
                </label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium mb-2">
                  Type *
                </label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {issueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="complainantName" className="block text-sm font-medium mb-2">
                  Complainant Name *
                </label>
                <Input
                  id="complainantName"
                  type="text"
                  required
                  value={formData.complainantName}
                  onChange={(e) => handleInputChange("complainantName", e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Your phone number"
              />
            </div>

            <div>
              <label htmlFor="photoLink" className="block text-sm font-medium mb-2">
                Issue Photo or Link
              </label>
              <Input
                id="photoLink"
                type="url"
                value={formData.photoLink}
                onChange={(e) => handleInputChange("photoLink", e.target.value)}
                placeholder="https://example.com/photo.jpg or link to image"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description *
              </label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Detailed description of the issue"
                rows={4}
              />
            </div>

            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "your-recaptcha-site-key"}
                onChange={handleCaptchaChange}
              />
            </div>

            {submitStatus === "success" && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your issue has been submitted successfully. We'll review it and take appropriate action.
                </AlertDescription>
              </Alert>
            )}

            {submitStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting || !captchaToken} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Issue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}