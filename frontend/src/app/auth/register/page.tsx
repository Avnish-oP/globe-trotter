'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, User, MapPin, Heart, Plane, Phone, Globe, Tag, Plus, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import ProfilePictureUpload from '@/components/ProfilePictureUpload';

const predefinedAvatars = [
  { id: 1, url: '/avatars/doodle1.png', name: 'Doodle 1', emoji: '😊' },
  { id: 2, url: '/avatars/doodle2.png', name: 'Doodle 2', emoji: '🌟' },
  { id: 3, url: '/avatars/doodle3.png', name: 'Doodle 3', emoji: '🎨' },
  { id: 4, url: '/avatars/doodle4.png', name: 'Doodle 4', emoji: '🚀' },
  { id: 5, url: '/avatars/doodle5.png', name: 'Doodle 5', emoji: '🌺' },
  { id: 6, url: '/avatars/doodle6.png', name: 'Doodle 6', emoji: '⚡' },
];

const countryList = [
  'United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa', 'Other',
];

// Step 1: Basic Info
const step1Schema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 'Password must contain uppercase, lowercase, number, and special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phone: z.string().optional().refine(val => !val || /^\d{7,15}$/.test(val), { message: 'Phone must be numeric and 7-15 digits' }),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 2: Personal Details
const step2Schema = z.object({
  age: z.number().int().min(13, 'Age must be at least 13'),
  gender: z.enum(['Male', 'Female', 'Other']),
  genderOther: z.string().optional(),
  isStudent: z.enum(['Yes', 'No']),
});

// Step 3: Travel Preferences
const step3Schema = z.object({
  travelStyles: z.array(z.string()).min(1, 'Select at least one travel style'),
  favActivities: z.array(z.string()).min(2, 'Add at least 2 favourite activities'),
  bio: z.string().min(1, 'User bio is required'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const TRAVEL_STYLES = [
  { value: 'budget', label: 'Budget Explorer', icon: '🌿', color: 'emerald' },
  { value: 'luxury', label: 'Luxury Seeker', icon: '✨', color: 'purple' },
  { value: 'adventure', label: 'Adventure Lover', icon: '🏔️', color: 'orange' },
  { value: 'cultural', label: 'Culture Enthusiast', icon: '🏛️', color: 'blue' },
  { value: 'relaxation', label: 'Wellness Traveler', icon: '🧘', color: 'teal' },
  { value: 'business', label: 'Business Nomad', icon: '💼', color: 'gray' },
  { value: 'family', label: 'Family Explorer', icon: '👨‍👩‍👧‍👦', color: 'rose' },
];

const ACTIVITY_OPTIONS = [
  'hiking', 'museums', 'beaches', 'food-tours', 'nightlife', 'shopping', 
  'photography', 'wildlife', 'adventure-sports', 'history', 'art', 'music'
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activityInput, setActivityInput] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Step 1 Form
  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      city: '',
      country: '',
    },
  });

  // Step 2 Form  
  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
    defaultValues: {
      gender: 'Male',
      isStudent: 'No',
    },
  });

  // Step 3 Form
  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    mode: 'onChange',
    defaultValues: {
      travelStyles: [],
      favActivities: [],
      bio: '',
    },
  });

  // Watch for dynamic fields
  const genderValue = step2Form.watch('gender');
  const travelStyles = step3Form.watch('travelStyles') || [];
  const favActivities = step3Form.watch('favActivities') || [];

  React.useEffect(() => {
    if (genderValue !== 'Other') step2Form.setValue('genderOther', '');
  }, [genderValue, step2Form]);

  // Handle travel style selection
  const toggleTravelStyle = (style: string) => {
    const current = travelStyles;
    const updated = current.includes(style) 
      ? current.filter(s => s !== style)
      : [...current, style];
    step3Form.setValue('travelStyles', updated, { shouldValidate: true });
  };

  // Handle activity management
  const handleAddActivity = () => {
    if (activityInput.trim() && !favActivities.includes(activityInput.trim())) {
      const updated = [...favActivities, activityInput.trim()];
      step3Form.setValue('favActivities', updated, { shouldValidate: true });
      setActivityInput('');
    }
  };

  const handleRemoveActivity = (activity: string) => {
    const updated = favActivities.filter(a => a !== activity);
    step3Form.setValue('favActivities', updated, { shouldValidate: true });
  };

  // Navigation
  const nextStep = async () => {
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = await step1Form.trigger();
      if (isValid) setCurrentStep(2);
    } else if (currentStep === 2) {
      isValid = await step2Form.trigger();
      if (isValid) setCurrentStep(3);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Final submission
  const onSubmit = async () => {
    const isStep3Valid = await step3Form.trigger();
    if (!isStep3Valid) return;

    setLoading(true);
    try {
      const step1Data = step1Form.getValues();
      const step2Data = step2Form.getValues();
      const step3Data = step3Form.getValues();

      console.log('🔍 Step 1 Data:', step1Data);
      console.log('🔍 Step 2 Data:', step2Data);
      console.log('🔍 Step 3 Data:', step3Data);

      // Map frontend data to backend expected format
      const registrationData = {
        name: step1Data.name,
        email: step1Data.email,
        password: step1Data.password,
        country_origin: step1Data.country,
        fav_activities: step3Data.favActivities,
        fav_places: [], // We don't collect this in the form currently
        travel_style: step3Data.travelStyles[0] || 'budget', // Take first travel style or default to budget
        profile_picture_url: profilePictureUrl,
      };

      console.log('🔍 Mapped Registration Data:', registrationData);

      await registerUser(registrationData);
      router.push('/dashboard');
    } catch (error: any) {
      step3Form.setError('root', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/30 blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-24 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-purple-200/25 to-indigo-200/25 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-24 left-1/3 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-200/20 blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="min-h-screen flex items-center justify-center p-3 sm:p-6">
        <div className="w-full max-w-2xl glass-nature rounded-3xl shadow-2xl border border-border/40 overflow-hidden backdrop-blur-xl">
          <div className="p-6 sm:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Plane className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-3xl font-bold text-foreground">GlobeTrotter</h1>
              </div>
              <p className="text-muted-foreground">Sign up and start your journey!</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      currentStep >= step 
                        ? 'bg-primary border-primary text-white' 
                        : 'border-border bg-background text-muted-foreground'
                    }`}>
                      {currentStep > step ? <Check className="h-5 w-5" /> : step}
                    </div>
                    {step < 3 && (
                      <div className={`w-16 h-1 mx-2 transition-colors duration-300 ${
                        currentStep > step ? 'bg-primary' : 'bg-border'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Step {currentStep} of 3: {
                    currentStep === 1 ? 'Basic Information' :
                    currentStep === 2 ? 'Personal Details' :
                    'Travel Preferences'
                  }
                </p>
              </div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        {...step1Form.register('name')} 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                        placeholder="Enter your full name" 
                      />
                    </div>
                    {step1Form.formState.errors.name && (
                      <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        {...step1Form.register('email')} 
                        type="email" 
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                        placeholder="Enter your email" 
                      />
                    </div>
                    {step1Form.formState.errors.email && (
                      <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Password</label>
                  <div className="relative">
                    <input 
                      {...step1Form.register('password')} 
                      type="password" 
                      className="w-full py-3 px-4 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                      placeholder="Enter a strong password" 
                    />
                  </div>
                  {step1Form.formState.errors.password && (
                    <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm Password</label>
                  <div className="relative">
                    <input 
                      {...step1Form.register('confirmPassword')} 
                      type="password" 
                      className="w-full py-3 px-4 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                      placeholder="Confirm your password" 
                    />
                  </div>
                  {step1Form.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number <span className="text-muted-foreground">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        {...step1Form.register('phone')} 
                        type="tel" 
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                        placeholder="e.g. 9876543210" 
                      />
                    </div>
                    {step1Form.formState.errors.phone && (
                      <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input 
                        {...step1Form.register('city')} 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                        placeholder="Enter your city" 
                      />
                    </div>
                    {step1Form.formState.errors.city && (
                      <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <select 
                      {...step1Form.register('country')} 
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors"
                    >
                      <option value="">Select your country</option>
                      {countryList.map((country) => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  {step1Form.formState.errors.country && (
                    <p className="mt-1 text-sm text-destructive">{step1Form.formState.errors.country.message}</p>
                  )}
                </div>
              </form>
            )}

            {/* Step 2: Personal Details */}
            {currentStep === 2 && (
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-4">Profile Picture</label>
                  <div className="flex justify-center">
                    <ProfilePictureUpload
                      currentImageUrl={profilePictureUrl || undefined}
                      onImageChange={setProfilePictureUrl}
                      size="lg"
                      userName={step1Form.getValues('name')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Upload a profile picture or skip to continue (you can add one later)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Age</label>
                    <input 
                      {...step2Form.register('age', { valueAsNumber: true })} 
                      type="number" 
                      min={13} 
                      className="w-full py-3 px-4 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                      placeholder="Enter your age" 
                    />
                    {step2Form.formState.errors.age && (
                      <p className="mt-1 text-sm text-destructive">{step2Form.formState.errors.age.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Are you a student?</label>
                    <div className="flex gap-4 items-center text-foreground mt-3">
                      <label className="flex items-center gap-2">
                        <input type="radio" value="Yes" {...step2Form.register('isStudent')} className="accent-primary" /> 
                        Yes
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" value="No" {...step2Form.register('isStudent')} className="accent-primary" /> 
                        No
                      </label>
                    </div>
                    {step2Form.formState.errors.isStudent && (
                      <p className="mt-1 text-sm text-destructive">{step2Form.formState.errors.isStudent.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Gender</label>
                  <div className="flex gap-4 items-center text-foreground">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="Male" {...step2Form.register('gender')} className="accent-primary" /> 
                      Male
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="Female" {...step2Form.register('gender')} className="accent-primary" /> 
                      Female
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="Other" {...step2Form.register('gender')} className="accent-primary" /> 
                      Other
                    </label>
                  </div>
                  {genderValue === 'Other' && (
                    <div className="mt-3">
                      <input 
                        {...step2Form.register('genderOther')} 
                        type="text" 
                        className="w-full py-2 px-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50" 
                        placeholder="Please specify your gender" 
                      />
                    </div>
                  )}
                  {step2Form.formState.errors.gender && (
                    <p className="mt-1 text-sm text-destructive">{step2Form.formState.errors.gender.message}</p>
                  )}
                </div>
              </form>
            )}

            {/* Step 3: Travel Preferences */}
            {currentStep === 3 && (
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Travel Styles */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    What type of traveler are you? <span className="text-muted-foreground">(Select all that apply)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {TRAVEL_STYLES.map((style) => (
                      <div
                        key={style.value}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          travelStyles.includes(style.value)
                            ? 'border-primary bg-primary/10'
                            : 'border-border bg-card hover:border-primary/50'
                        }`}
                        onClick={() => toggleTravelStyle(style.value)}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{style.icon}</span>
                          <div>
                            <p className="font-medium text-foreground">{style.label}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {step3Form.formState.errors.travelStyles && (
                    <p className="mt-1 text-sm text-destructive">{step3Form.formState.errors.travelStyles.message}</p>
                  )}
                </div>

                {/* Activities */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Favourite Activities <span className="text-muted-foreground">(min 2)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {favActivities.map((activity) => (
                      <span 
                        key={activity} 
                        className="flex items-center bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium border border-accent/20"
                      >
                        {activity}
                        <button 
                          type="button" 
                          className="ml-2 text-accent hover:text-destructive" 
                          onClick={() => handleRemoveActivity(activity)}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={activityInput} 
                      onChange={e => setActivityInput(e.target.value)} 
                      onKeyDown={e => { 
                        if (e.key === 'Enter') { 
                          e.preventDefault(); 
                          handleAddActivity(); 
                        } 
                      }} 
                      className="flex-1 py-2 px-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50" 
                      placeholder="Add an activity and press Enter" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddActivity} 
                      className="gradient-primary text-white px-3 py-2 rounded-xl hover:opacity-95 transition-colors"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                  </div>
                  {step3Form.formState.errors.favActivities && (
                    <p className="mt-1 text-sm text-destructive">{step3Form.formState.errors.favActivities.message}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Tell us about yourself</label>
                  <textarea 
                    {...step3Form.register('bio')} 
                    rows={3} 
                    className="w-full py-2 px-3 border border-border rounded-xl bg-background text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary/50 transition-colors" 
                    placeholder="Share your travel dreams, experiences, or what you're looking for..." 
                  />
                  {step3Form.formState.errors.bio && (
                    <p className="mt-1 text-sm text-destructive">{step3Form.formState.errors.bio.message}</p>
                  )}
                </div>

                {/* Error Message */}
                {step3Form.formState.errors.root && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-destructive text-sm">{step3Form.formState.errors.root.message}</p>
                  </div>
                )}
              </form>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors ${
                  currentStep === 1
                    ? 'opacity-50 cursor-not-allowed bg-muted text-muted-foreground'
                    : 'bg-card text-foreground border border-border hover:bg-muted'
                }`}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-95 transition-colors"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={loading}
                  className="flex items-center gradient-primary text-white px-6 py-3 rounded-xl font-medium hover:opacity-95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              )}
            </div>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:opacity-90 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
