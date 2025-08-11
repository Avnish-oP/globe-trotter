'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, User, MapPin, Heart, Plane, Phone, Globe, Tag, Plus } from 'lucide-react';


const countryList = [
  'United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China', 'Brazil', 'South Africa', 'Other',
];

const registerSchema = z.object({
  name: z.string().min(2, 'Full Name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().refine(val => !val || /^\d{7,15}$/.test(val), { message: 'Phone must be numeric and 7-15 digits' }),
  age: z.string().refine(val => /^[1-9][0-9]*$/.test(val), { message: 'Age is required and must be a positive integer' }),
  gender: z.enum(['Male', 'Female', 'Other']),
  genderOther: z.string().optional(),
  isStudent: z.enum(['Yes', 'No']),
  city: z.string().min(2, 'City is required'),
  country: z.string().min(2, 'Country is required'),
  favPlaces: z.array(z.string()).min(2, 'Add at least 2 favourite cities/countries'),
  favActivities: z.array(z.string()).min(2, 'Add at least 2 favourite activities'),
  bio: z.string().min(1, 'User bio is required'),
  profilePicture: z.any().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const TRAVEL_STYLES = [
  { value: 'budget', label: 'Budget', icon: '💰' },
  { value: 'luxury', label: 'Luxury', icon: '✨' },
  { value: 'adventure', label: 'Adventure', icon: '🏔️' },
  { value: 'cultural', label: 'Cultural', icon: '🏛️' },
  { value: 'relaxation', label: 'Relaxation', icon: '🏖️' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
];

const ACTIVITY_OPTIONS = [
  'hiking', 'museums', 'beaches', 'food-tours', 'nightlife', 'shopping', 
  'photography', 'wildlife', 'adventure-sports', 'history', 'art', 'music'
];

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [favPlaces, setFavPlaces] = useState<string[]>([]);
  const [favActivities, setFavActivities] = useState<string[]>([]);
  const [placeInput, setPlaceInput] = useState('');
  const [activityInput, setActivityInput] = useState('');
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isValid },
    setError,
    clearErrors,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      gender: 'Male',
      isStudent: 'No',
      favPlaces: [],
      favActivities: [],
    },
  });

  // Watch gender for dynamic field
  const genderValue = watch('gender');

  React.useEffect(() => {
    if (genderValue !== 'Other') setValue('genderOther', '');
  }, [genderValue, setValue]);

  // Profile picture preview handler
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue('profilePicture', file);
      setProfilePreview(URL.createObjectURL(file));
    } else {
      setValue('profilePicture', undefined);
      setProfilePreview(null);
    }
  };

  // Tag input handlers
  const handleAddPlace = () => {
    if (placeInput.trim() && !favPlaces.includes(placeInput.trim())) {
      const updated = [...favPlaces, placeInput.trim()];
      setFavPlaces(updated);
      setValue('favPlaces', updated, { shouldValidate: true });
      setPlaceInput('');
      clearErrors('favPlaces');
    }
  };
  const handleRemovePlace = (place: string) => {
    const updated = favPlaces.filter(p => p !== place);
    setFavPlaces(updated);
    setValue('favPlaces', updated, { shouldValidate: true });
  };
  const handleAddActivity = () => {
    if (activityInput.trim() && !favActivities.includes(activityInput.trim())) {
      const updated = [...favActivities, activityInput.trim()];
      setFavActivities(updated);
      setValue('favActivities', updated, { shouldValidate: true });
      setActivityInput('');
      clearErrors('favActivities');
    }
  };
  const handleRemoveActivity = (activity: string) => {
    const updated = favActivities.filter(a => a !== activity);
    setFavActivities(updated);
    setValue('favActivities', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      // Prepare form data for file upload if needed
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'favPlaces' || key === 'favActivities') {
          (value as string[]).forEach((v) => formData.append(key, v));
        } else if (key === 'profilePicture' && value instanceof File) {
          formData.append('profilePicture', value);
        } else {
          formData.append(key, value as string);
        }
      });
  const genderValue = data.gender === 'Other' ? (data.genderOther || '') : data.gender;
  formData.set('gender', genderValue);
  formData.set('age', String(data.age));

      // You may need to update registerUser to accept FormData if backend supports file upload
      await registerUser(formData);
      router.push('/dashboard');
    } catch (error: any) {
      setError('root', { message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-2">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Plane className="h-8 w-8 text-blue-600 mr-2" />
              <h1 className="text-3xl font-bold text-gray-900">GlobeTrotter</h1>
            </div>
            <p className="text-gray-600">Sign up and start your journey!</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" encType="multipart/form-data">
            {/* Profile Picture (Optional, Centered Avatar) */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative group">
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfileChange}
                  className="hidden"
                />
                <label htmlFor="profilePictureInput" className="cursor-pointer">
                  <span className="relative block">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile Preview"
                        className="h-24 w-24 object-cover rounded-full border-2 border-blue-400 shadow"
                      />
                    ) : (
                      <span className="flex items-center justify-center h-24 w-24 rounded-full bg-blue-100 border-2 border-blue-300 text-blue-400 text-5xl">
                        <User className="h-12 w-12" />
                      </span>
                    )}
                    <span className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-1 border-2 border-white shadow-lg group-hover:bg-blue-700 transition-colors">
                      <Plus className="h-5 w-5 text-white" />
                    </span>
                  </span>
                </label>
              </div>
              <span className="text-xs text-gray-500 mt-2">Profile Picture (Optional)</span>
            </div>
            {/* Error Message */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{errors.root.message}</p>
              </div>
            )}

            {/* Row 1: Name, Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-700" />
                  <input {...register('name')} type="text" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Enter your full name" />
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input {...register('email')} type="email" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Enter your email" />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>
            </div>

            {/* Row 2: Phone, Age */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number <span className="text-gray-400">(Optional)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input {...register('phone')} type="tel" inputMode="numeric" className="w-full pl-10 pr-4 py-3 border
                   border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="e.g. 9876543210" />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <div className="relative">
                  <input {...register('age')} type="number" min={1} className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Enter your age" />
                </div>
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>}
              </div>
            </div>

            {/* Row 3: Gender, Student */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1">
                    <input type="radio" value="Male" {...register('gender')} className="accent-blue-600" /> Male
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" value="Female" {...register('gender')} className="accent-blue-600" /> Female
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" value="Other" {...register('gender')} className="accent-blue-600" /> Other
                  </label>
                </div>
                {genderValue === 'Other' && (
                  <div className="mt-2 transition-all duration-300">
                    <input {...register('genderOther')} type="text" className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Please specify your gender" />
                  </div>
                )}
                {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                {errors.genderOther && <p className="mt-1 text-sm text-red-600">{errors.genderOther.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Are you a student?</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1">
                    <input type="radio" value="Yes" {...register('isStudent')} className="accent-blue-600" /> Yes
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" value="No" {...register('isStudent')} className="accent-blue-600" /> No
                  </label>
                </div>
                {errors.isStudent && <p className="mt-1 text-sm text-red-600">{errors.isStudent.message}</p>}
              </div>
            </div>

            {/* Row 4: City, Country */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input {...register('city')} type="text" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Enter your city" />
                </div>
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select {...register('country')} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                    <option value="">Select your country</option>
                    {countryList.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>}
              </div>
            </div>

            {/* Row 5: Favourite Cities/Countries (tags) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favourite Cities/Countries <span className="text-gray-400">(min 2)</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {favPlaces.map((place) => (
                  <span key={place} className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    {place}
                    <button type="button" className="ml-2 text-blue-500 hover:text-red-500" onClick={() => handleRemovePlace(place)}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={placeInput} onChange={e => setPlaceInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPlace(); } }} className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Add a city or country and press Enter" />
                <button type="button" onClick={handleAddPlace} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"><Tag className="h-4 w-4" /></button>
              </div>
              {errors.favPlaces && <p className="mt-1 text-sm text-red-600">{errors.favPlaces.message}</p>}
            </div>

            {/* Row 6: Favourite Activities (tags) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favourite Activities <span className="text-gray-400">(min 2)</span></label>
              <div className="flex flex-wrap gap-2 mb-2">
                {favActivities.map((activity) => (
                  <span key={activity} className="flex items-center bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-medium">
                    {activity}
                    <button type="button" className="ml-2 text-indigo-500 hover:text-red-500" onClick={() => handleRemoveActivity(activity)}>&times;</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={activityInput} onChange={e => setActivityInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddActivity(); } }} className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Add an activity and press Enter (e.g., skydiving)" />
                <button type="button" onClick={handleAddActivity} className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"><Tag className="h-4 w-4" /></button>
              </div>
              {errors.favActivities && <p className="mt-1 text-sm text-red-600">{errors.favActivities.message}</p>}
            </div>

            {/* Row 7: User Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User Bio</label>
              <textarea {...register('bio')} rows={3} className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" placeholder="Tell us about yourself, your travel dreams, etc." />
              {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || !isValid} className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            {/* Login Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign in</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
