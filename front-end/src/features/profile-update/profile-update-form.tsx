"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import {
  Camera, User, Lock, Briefcase, Building2, Pencil, Mail, Calendar, Loader2, MapPin,
  FileText, CheckCircle2, ShieldCheck, Phone, Globe, X, Trash2, Eye,
  ChevronRight, Award, RefreshCw, ExternalLink, BadgeCheck, MapPinned
} from "lucide-react";

import { RichTextEditor } from "@/components/rich-text-editor/rich-text-editor.lazy";
import { UserAvatar } from "@/components/user-avatar";
import { ImageCropperModal } from "./image-crop-modal"; 
import { useAuth } from "@/contexts/auth-context";
import {
  getAccountMe,
  patchAccountMe,
  uploadMyProfilePhoto,
  uploadMyProfileBanner,
  changeAccountPassword,
} from "@/lib/api/account-api";
import { isStaffAdminAccount } from "@/lib/api/auth-api";
import { BackendRequestError } from "@/lib/api/authed-client";
import {
  getMyCompany, updateMyCompany, uploadCompanyLogo, uploadCompanyHero
} from "@/lib/api/company-api";
import {
  getMyNurseProfile, patchMyNurseProfile, uploadMyNurseResumePdf,
} from "@/lib/api/nurse-profile-api";
import { blogCoverSrc } from "@/lib/blog-cover-image";
import { queryKeys } from "@/lib/query-keys";
import { isRichTextEffectivelyEmpty, sanitizeJobRichHtml } from "@/lib/sanitize-job-html";

function parseHealthcareLocationLines(text: string): { name: string; address: string | null }[] {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0).map((name) => ({ name, address: null }));
}

function formatHealthcareLocationLines(rows: { name: string; address?: string | null }[] | null | undefined): string {
  if (!rows?.length) return "";
  return rows.map((r) => r.name + (r.address ? ` — ${r.address}` : "")).join("\n");
}

type SettingsTab = "profile" | "professional" | "security";

export function ProfileUpdateForm() {
  const queryClient = useQueryClient();
  const { user, accessToken, updateUser } = useAuth();

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Forms
  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseState, setLicenseState] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [certifications, setCertifications] = useState("");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [pendingResumeFile, setPendingResumeFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companySlug, setCompanySlug] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyCulture, setCompanyCulture] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyLocationsText, setCompanyLocationsText] = useState("");
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const [companyHeroUrl, setCompanyHeroUrl] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingHero, setPendingHero] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [cropper, setCropper] = useState<{
    show: boolean;
    image: string;
    aspect: number;
    type: "profile" | "logo" | "hero" | "banner";
  }>({ show: false, image: "", aspect: 1, type: "profile" });

  const isAdmin = user ? isStaffAdminAccount(user.role) : false;
  const isNurse = user?.role === "nurse";
  interface ProfileStrengthProps {
  role: string;
  data: any; // Passing current state values
  onAction: () => void;
}

function ProfileStrengthCard({ role, data, onAction }: ProfileStrengthProps) {
  // Define which fields matter for which role
  const criteria = role === "nurse" 
    ? [
        { key: "fullName", label: "Full Name" },
        { key: "specialization", label: "Specialization" },
        { key: "licenseNumber", label: "License Number" },
        { key: "experienceYears", label: "Years of Experience" },
        { key: "city", label: "Location" },
        { key: "resumeUrl", label: "Resume PDF" },
        { key: "profilePhotoUrl", label: "Profile Photo" },
        { key: "profileBannerUrl", label: "Profile Banner" },
      ]
    : [
        { key: "companyName", label: "Company Name" },
        { key: "companyLogoUrl", label: "Company Logo" },
        { key: "companyEmail", label: "Contact Email" },
        { key: "companyDescription", label: "Company Bio" },
        { key: "companyHeroUrl", label: "Banner Image" },
      ];

  // Calculate actual completion
  const completedFields = criteria.filter(item => !!data[item.key]);
  const percentage = Math.round((completedFields.length / criteria.length) * 100);
  const nextMissing = criteria.find(item => !data[item.key]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">Profile Strength</h3>
        <span className={`text-xs font-black ${percentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div 
          className="h-full bg-red-600 transition-all duration-700 ease-out" 
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-4">
        {percentage === 100 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={14} strokeWidth={3} />
            <p className="text-[11px] font-bold">All-Star Profile</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Increase your visibility by adding your <span className="font-bold text-slate-900">{nextMissing?.label}</span>.
            </p>
            <button 
              onClick={onAction}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-[10px] font-black uppercase text-slate-600 hover:border-red-600 hover:text-red-600 transition-all"
            >
              Complete Now <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

  const resolveImageUrl = (path: string | null) => {
    if (!path) return null;
    if (path.startsWith('blob:') || path.startsWith('data:')) return path;
    const base = blogCoverSrc(path);
    if (!base) return null;
    return `${base}${base.includes('?') ? '&' : '?'}cache=${refreshKey}`;
  };

  const nurseBannerImage = isNurse
    ? resolveImageUrl(user?.profileBannerUrl ?? null)
    : null;

  const loadData = useCallback(async () => {
    if (!accessToken || !user) return;
    setIsHydrating(true);
    try {
      const me = await getAccountMe(accessToken);
      setFullName(me.fullName || "");
      if (user.role === "company") {
        try {
          const c = await getMyCompany(accessToken);
          setCompanyName(c.name || "");
          setCompanySlug(c.slug || "");
          setCompanyDescription(c.description || "");
          setCompanyCulture(c.cultureText || "");
          setCompanyEmail(c.contactEmail || "");
          setCompanyPhone(c.contactPhone || "");
          setCompanyLocationsText(formatHealthcareLocationLines(c.locationsJson ?? null));
          setCompanyLogoUrl(c.logoUrl);
          setCompanyHeroUrl(c.heroImageUrl);
        } catch (e) { if (e instanceof BackendRequestError && e.status === 404) console.warn("No Healthcrae found"); }
      }
      if (user.role === "nurse") {
        try {
          const np = await getMyNurseProfile(accessToken);
          setSpecialization(np.specialization || "");
          setLicenseNumber(np.licenseNumber || "");
          setLicenseState(np.licenseState || "");
          setCity(np.city || "");
          setStateRegion(np.stateRegion || "");
          setDateOfBirth(np.dateOfBirth ? String(np.dateOfBirth).slice(0, 10) : "");
          setCertifications(np.certifications || "");
          setExperienceYears(np.yearsExperience != null ? String(np.yearsExperience) : "");
          setResumeUrl(np.resumeUrl || null);
        } catch (e) {}
      }
      updateUser({
        ...user,
        fullName: me.fullName,
        profilePhotoUrl: me.profilePhotoUrl,
        profileBannerUrl: me.profileBannerUrl ?? null,
      });
      setRefreshKey(Date.now());
    } catch (e) { console.error("Hydration failed", e); } finally { setIsHydrating(false); }
  }, [accessToken, user?.id, updateUser]);

  useEffect(() => { loadData(); }, [loadData]);

  const onFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profile" | "logo" | "hero" | "banner",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const aspect =
        type === "hero" || type === "banner" ? 16 / 6 : 1;
      setCropper({
        show: true,
        image: reader.result as string,
        aspect,
        type,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    const file = new File([blob], "upload.jpg", { type: "image/jpeg" });
    setCropper((prev) => ({ ...prev, show: false }));
    if (cropper.type === "profile") {
      setIsBusy(true);
      try {
        const me = await uploadMyProfilePhoto(accessToken!, file);
        updateUser({ ...user!, profilePhotoUrl: me.profilePhotoUrl });
        setRefreshKey(Date.now());
        Swal.fire({ title: "Avatar Updated", icon: "success", timer: 1000, showConfirmButton: false });
      } catch (e: any) { Swal.fire("Error", e.message, "error"); } finally { setIsBusy(false); }
    } else if (cropper.type === "logo") {
      setPendingLogo(file);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(URL.createObjectURL(file));
    } else if (cropper.type === "hero") {
      setPendingHero(file);
      if (heroPreview) URL.revokeObjectURL(heroPreview);
      setHeroPreview(URL.createObjectURL(file));
    } else if (cropper.type === "banner") {
      setIsBusy(true);
      try {
        const me = await uploadMyProfileBanner(accessToken!, file);
        updateUser({
          ...user!,
          profileBannerUrl: me.profileBannerUrl ?? null,
        });
        setRefreshKey(Date.now());
        Swal.fire({
          title: "Banner saved",
          icon: "success",
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        Swal.fire("Error", msg, "error");
      } finally {
        setIsBusy(false);
      }
    }
  };

  const saveProfessional = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      if (user?.role === "company" && pendingLogo) await uploadCompanyLogo(accessToken!, pendingLogo);
      if (user?.role === "company" && pendingHero) await uploadCompanyHero(accessToken!, pendingHero);
      if (user?.role === "nurse" && pendingResumeFile) await uploadMyNurseResumePdf(accessToken!, pendingResumeFile);
      if (user?.role === "nurse") {
        await patchMyNurseProfile(accessToken!, {
          specialization: specialization.trim(),
          licenseNumber: licenseNumber.trim(),
          licenseState: licenseState.trim() || null,
          yearsExperience: experienceYears.trim() === "" ? null : parseInt(experienceYears, 10),
          certifications: certifications.trim() || null,
        });
      } else if (user?.role === "company") {
        await updateMyCompany(accessToken!, {
          name: companyName, contactEmail: companyEmail, contactPhone: companyPhone,
          description: isRichTextEffectivelyEmpty(companyDescription) ? null : sanitizeJobRichHtml(companyDescription),
          cultureText: isRichTextEffectivelyEmpty(companyCulture) ? null : sanitizeJobRichHtml(companyCulture),
          locations: parseHealthcareLocationLines(companyLocationsText),
        });
      }
      setIsEditing(false);
      setRefreshKey(Date.now());
      Swal.fire({ title: "Profile Updated", icon: "success", timer: 1500, showConfirmButton: false });
      if (user?.role === "company") {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.companyBootstrap(user.id),
        });
      }
      await loadData();
    } catch (e: any) { Swal.fire("Update Failed", e.message || "An error occurred", "error"); } finally { setIsBusy(false); }
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      await patchAccountMe(accessToken!, { fullName: fullName.trim() });
      if (user?.role === "nurse") {
        await patchMyNurseProfile(accessToken!, {
          city: city.trim() || null, stateRegion: stateRegion.trim() || null, dateOfBirth: dateOfBirth.trim() || null,
        });
      }
      setIsEditing(false);
      updateUser({ ...user!, fullName: fullName.trim() });
      Swal.fire({ title: "Saved", icon: "success", timer: 1500, showConfirmButton: false });
    } catch (e: any) { Swal.fire("Error", e.message, "error"); } finally { setIsBusy(false); }
  };

  if (!user) return null;

  return (
    <div className="w-full min-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hidden Inputs */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'logo')} />
      <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={(e) => onFileChange(e, 'hero')} />
      {/* HEADER CARD */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* Banner */}
        <div className="h-48 w-full bg-slate-100 sm:h-64">
          {isNurse && nurseBannerImage ? (
            <img src={nurseBannerImage} className="h-full w-full object-cover" alt="Banner" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-red-600 to-rose-500 opacity-90" />
          )}
          {isNurse && (
            <label className="absolute right-6 top-6 flex cursor-pointer items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition-all hover:bg-black/50">
              <Camera size={16} /> Edit Banner
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => onFileChange(e, "banner")}
              />
            </label>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="relative px-6 pb-8 sm:px-10 mt-2">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end -mt-16 sm:-mt-20">
            <div className="relative group">
              <div className="h-42 w-42 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl sm:h-44 sm:w-44">
                <UserAvatar 
                  email={user.email} 
                  displayName={fullName} 
                  photoUrl={resolveImageUrl(user.profilePhotoUrl || null) || undefined} 
                  size={160} 
                  className="h-full w-full object-cover" 
                />
              </div>
              <label className="absolute bottom-2 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-110">
                <Camera size={18} />
                <input type="file" className="hidden" accept="image/*" onChange={(e) => onFileChange(e, "profile")} />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left pt-3">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start ">
                <h1 className="text-3xl  font-bold text-slate-900">{fullName || "Nurse Professional"}</h1>
                <BadgeCheck className="text-blue-500" size={24} fill="currentColor" fillOpacity={0.1} />
              </div>
              <p className="mt-1 text-lg font-medium text-slate-500">
                {isNurse ? (specialization || "Healthcare Professional") : (companyName || "Organization Admin")}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-medium text-slate-400 sm:justify-start">
                <span className="flex items-center gap-1.5"><Mail size={16} className="text-slate-300" /> {user.email}</span>
                {city && <span className="flex items-center gap-1.5"><MapPin size={16} className="text-slate-300" /> {city}, {stateRegion}</span>}
              </div>
              
            </div>

            <div className="flex gap-3">
              {!isEditing && activeTab !== "security" && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-red-700 transition-all"
                >
                  <Pencil size={16} /> Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* SIDEBAR NAVIGATION */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <p className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Account Settings</p>
              <nav className="space-y-1">
                <NavItem active={activeTab === "profile"} onClick={() => { setActiveTab("profile"); setIsEditing(false); }} icon={<User size={20} />} label="Personal Info" />
                {!isAdmin && (
                  <NavItem
                    active={activeTab === "professional"}
                    onClick={() => { setActiveTab("professional"); setIsEditing(false); }}
                    icon={<Briefcase size={20} />}
                    label={user?.role === "company" ? "Company Details" : "Work & License"}
                  />
                )}
                <NavItem active={activeTab === "security"} onClick={() => { setActiveTab("security"); setIsEditing(false); }} icon={<Lock size={20} />} label="Security" />
              </nav>
            </div>

            {/* Quick Stats / Info Card */}
       {!isAdmin && user.role !== 'super_admin' && (
          <ProfileStrengthCard
            role={user.role} 
            data={{
              fullName,
              specialization,
              licenseNumber,
              experienceYears,
              city,
              resumeUrl: resumeUrl || pendingResumeFile,
              profilePhotoUrl: user.profilePhotoUrl,
              profileBannerUrl: user.profileBannerUrl,
              companyName,
              companyLogoUrl: companyLogoUrl || pendingLogo,
              companyEmail,
              companyDescription,
              companyHeroUrl: companyHeroUrl || pendingHero
            }}
            onAction={() => {
              setActiveTab("professional");
              setIsEditing(true);
            }}
          />
        )}
            
          </div>
        </div>

        {/* MAIN FEED CONTENT */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="min-h-[300px] rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
            {isHydrating ? (
              <div className="flex h-64 flex-col items-center justify-center text-slate-400">
                <Loader2 className="mb-4 animate-spin text-red-600" size={40} />
                <span className="text-sm font-medium">Syncing your details...</span>
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* PERSONAL TAB */}
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">Personal Identity</h2>
                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><User size={20} /></div>
                    </div>
                    
                    {!isEditing ? (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InfoTile label="Full Name" value={fullName} icon={<User size={18} />} />
                        <InfoTile label="Email Address" value={user.email} icon={<Mail size={18} />} />
                        {isNurse && (
                          <>
                            <InfoTile label="Current Location" value={`${city}, ${stateRegion}`} icon={<MapPinned size={18} />} />
                            <InfoTile label="Birthday" value={dateOfBirth} icon={<Calendar size={18} />} />
                          </>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={saveAccount} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Full Legal Name</label>
                            <input className="w-full rounded-xl border form-input border-slate-200 bg-slate-50 px-4 py-3 focus:border-red-500 focus:ring-0 transition-all" value={fullName} onChange={e => setFullName(e.target.value)} required />
                          </div>
                          {isNurse && (
                            <>
                              <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">City</label>
                                <input className="w-full rounded-xl border form-input border-slate-200 bg-slate-50 px-4 py-3 focus:border-red-500 focus:ring-0" value={city} onChange={e => setCity(e.target.value)} />
                              </div>
                              <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">State / Region</label>
                                <input className="w-full rounded-xl border form-input border-slate-200 bg-slate-50 px-4 py-3 focus:border-red-500 focus:ring-0" value={stateRegion} onChange={e => setStateRegion(e.target.value)} />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Date of Birth</label>
                                <input type="date" className="w-full rounded-xl form-input border border-slate-200 bg-slate-50 px-4 py-3 focus:border-red-500 focus:ring-0" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                              </div>
                            </>
                          )}
                        </div>
                        <FormActions isBusy={isBusy} onCancel={() => setIsEditing(false)} />
                      </form>
                    )}
                  </div>
                )}

                {/* PROFESSIONAL TAB */}
                {activeTab === "professional" && !isAdmin && (
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-slate-900">
                        {user.role === "nurse" ? "Credentials & Experience" : "Company Branding"}
                      </h2>
                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><Briefcase size={20} /></div>
                    </div>

                    {!isEditing ? (
                      <div className="space-y-10">
                        {user.role === "nurse" ? (
                          <div className="space-y-8">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                              <InfoTile label="Specialization" value={specialization} icon={<Award size={18} />} />
                              <InfoTile label="Experience" value={experienceYears ? `${experienceYears} Years` : null} icon={<Calendar size={18} />} />
                              <InfoTile label="License #" value={licenseNumber} icon={<ShieldCheck size={18} />} />
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
                              <h4 className="mb-3 text-xs font-bold uppercase text-slate-400">Certifications</h4>
                              <p className="text-slate-700 font-medium">{certifications || "No certifications listed"}</p>
                            </div>
                            {resumeUrl && (
                              <div className="flex items-center justify-between rounded-2xl border-2 border-dashed border-slate-200 p-6">
                                <div className="flex items-center gap-4">
                                  <div className="rounded-xl bg-red-50 p-3 text-red-600"><FileText size={24} /></div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-900">Active Resume PDF</p>
                                    <p className="text-xs text-slate-500">Uploaded for applications</p>
                                  </div>
                                </div>
                                <button onClick={() => window.open(resumeUrl)} className="rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-red-600 hover:text-red-600 transition-all">View File</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-10">
                            {/* Organization Brand Preview */}
                            <div className="group relative h-48 w-full overflow-hidden rounded-3xl border border-slate-100 bg-slate-50">
                              {companyHeroUrl ? (
                                <img src={resolveImageUrl(companyHeroUrl)!} className="h-full w-full object-cover" alt="Company Banner" />
                              ) : (
                                <div className="flex h-full items-center justify-center text-slate-200"><Building2 size={48} /></div>
                              )}
                              <div className="absolute bottom-4 left-4 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
                                <img src={resolveImageUrl(companyLogoUrl)!} className="h-full w-full object-contain" alt="Logo" onError={() => setLogoLoadError(true)} />
                              </div>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">
                                <InfoTile label="Public Email" value={companyEmail} icon={<Mail size={18} />} />
                                <InfoTile label="Public Phone" value={companyPhone} icon={<Phone size={18} />} />
                            </div>

                            <div className="space-y-6">
                              <RichDisplay label="Company Description" html={companyDescription} />
                              <RichDisplay label="Culture & Values" html={companyCulture} />
                               {companyLocationsText && (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase text-slate-400">Office Locations</h4>
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-600">
          {companyLocationsText}
        </pre>
      </div>
    </div>
  )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form onSubmit={saveProfessional} className="space-y-8">
                        {user.role === "nurse" ? (
                          <div className="grid gap-6 sm:grid-cols-2">
                            <div><label className="form-label">Primary Specialty</label><input className="form-input" value={specialization} onChange={e => setSpecialization(e.target.value)} placeholder="ER Nurse, ICU, etc." /></div>
                            <div><label className="form-label">License Number</label><input className="form-input" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} /></div>
                            <div><label className="form-label">License State</label><input className="form-input" value={licenseState} onChange={e => setLicenseState(e.target.value)} /></div>
                            <div><label className="form-label">Years of Experience</label><input type="number" className="form-input" value={experienceYears} onChange={e => setExperienceYears(e.target.value)} /></div>
                            <div className="sm:col-span-2"><label className="form-label">Certifications</label><textarea className="form-input min-h-[100px]" value={certifications} onChange={e => setCertifications(e.target.value)} /></div>
                            <div className="sm:col-span-2">
                              <label className="form-label">Upload Resume (PDF)</label>
                              <div onClick={() => resumeInputRef.current?.click()} className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-8 hover:border-red-400 transition-all">
                                {pendingResumeFile ? <CheckCircle2 className="text-green-500" /> : <FileText className="text-slate-300" />}
                                <span className="text-sm font-bold text-slate-600">{pendingResumeFile ? pendingResumeFile.name : "Select PDF File"}</span>
                              </div>
                              <input type="file" ref={resumeInputRef} className="hidden" accept=".pdf" onChange={e => setPendingResumeFile(e.target.files?.[0] || null)} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-8">
                            <div className="grid gap-6 sm:grid-cols-2">
                              <div className="sm:col-span-2"><label className="form-label">Organization Name</label><input className="form-input" value={companyName} onChange={e => setCompanyName(e.target.value)} required /></div>
                              <div><label className="form-label">Public Contact Email</label><input className="form-input" value={companyEmail} onChange={e => setCompanyEmail(e.target.value)} required /></div>
                              <div><label className="form-label">Public Phone</label><input className="form-input" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} /></div>
                              <div className="sm:col-span-2">
                                <label className="form-label">Branding Assets</label>
                                <div className="grid gap-4 sm:grid-cols-2">
                                  <ImageUploadTile label="Logo" preview={logoPreview || resolveImageUrl(companyLogoUrl)} onUpload={() => logoInputRef.current?.click()} />
                                  <ImageUploadTile label="Banner" preview={heroPreview || resolveImageUrl(companyHeroUrl)} onUpload={() => heroInputRef.current?.click()} isWide />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <label className="form-label">Company Bio</label>
                              <div className="rounded-2xl border border-slate-200 overflow-hidden"><RichTextEditor value={companyDescription} onChange={setCompanyDescription} /></div>
                              <div className="space-y-4">
  <label className="form-label">Culture & Values</label>
  <div className="rounded-2xl border border-slate-200 overflow-hidden">
    <RichTextEditor value={companyCulture} onChange={setCompanyCulture} />
  </div>
</div>

<div className="space-y-4">
  <label className="form-label">Office Locations (One per line)</label>
  <textarea 
    className="form-input min-h-[100px] font-mono text-sm" 
    placeholder="Main Hospital - New York, NY&#10;Satellite Clinic - Brooklyn, NY"
    value={companyLocationsText} 
    onChange={e => setCompanyLocationsText(e.target.value)} 
  />
  <p className="text-[10px] text-slate-400">Enter each facility name/address on a new line.</p>
</div>
                            </div>
                          </div>
                        )}
                        <FormActions isBusy={isBusy} onCancel={() => setIsEditing(false)} />
                      </form>
                    )}
                  </div>
                )}

                {/* SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="max-w-2xl space-y-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Security Credentials</h2>
                      <p className="mt-1 text-sm text-slate-500">Update your password regularly to keep your account safe.</p>
                    </div>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      if(passwords.new !== passwords.confirm) return Swal.fire("Error", "Passwords don't match", "error");
                      setIsBusy(true);
                      try {
                        await changeAccountPassword(accessToken!, { currentPassword: passwords.current, newPassword: passwords.new });
                        setPasswords({ current: "", new: "", confirm: "" });
                        Swal.fire("Success", "Password updated", "success");
                      } catch(e: any) { Swal.fire("Error", e.message, "error"); } finally { setIsBusy(false); }
                    }} className="space-y-6">
                      <div>
                        <label className="form-label">Current Password</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="password" required className="form-input pl-12" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2">
                        <div>
                          <label className="form-label">New Password</label>
                          <input type="password" required className="form-input" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                        </div>
                        <div>
                          <label className="form-label">Confirm New Password</label>
                          <input type="password" required className="form-input" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                        </div>
                      </div>
                      <button disabled={isBusy} className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 py-4 text-sm font-bold text-white hover:bg-red-800 transition-all">
                        {isBusy ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />} Update Password
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {cropper.show && (
        <ImageCropperModal
          image={cropper.image}
          aspect={cropper.aspect}
          title={`Crop ${cropper.type === "banner" ? "banner" : cropper.type}`}
          onClose={() => setCropper(p => ({ ...p, show: false }))}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}

/* --- REUSABLE COMPONENTS --- */

function NavItem({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
        active ? "bg-red-50 text-red-600 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={active ? "text-red-600" : "text-slate-400"}>{icon}</span>
      {label}
      {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-red-600" />}
    </button>
  );
}

function InfoTile({ label, value, icon }: any) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-hover hover:border-slate-200">
      <div className="mt-1 rounded-lg bg-slate-50 p-2 text-slate-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="truncate text-sm font-bold text-slate-700">{value || "Not specified"}</p>
      </div>
    </div>
  );
}

function RichDisplay({ label, html }: any) {
  if (isRichTextEffectivelyEmpty(html)) return null;
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase text-slate-400">{label}</h4>
      <div 
        className="prose prose-slate prose-sm max-w-none rounded-2xl border border-slate-100 bg-slate-50/50 p-6 text-slate-600" 
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    </div>
  );
}

function ImageUploadTile({ label, preview, onUpload, isWide }: any) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all hover:bg-white">
      <p className="mb-3 text-[10px] font-bold uppercase text-slate-400">{label}</p>
      <div className={`mx-auto mb-4 overflow-hidden rounded-lg border bg-white ${isWide ? 'h-24 w-full' : 'h-24 w-24'}`}>
        {preview ? <img src={preview} className="h-full w-full object-cover" alt="Preview" /> : <div className="flex h-full items-center justify-center text-slate-200"><Building2 size={24} /></div>}
      </div>
      <button type="button" onClick={onUpload} className="w-full rounded-lg bg-white border border-slate-200 py-2 text-xs font-bold text-slate-600 hover:border-red-400 hover:text-red-600">Change</button>
    </div>
  );
}

function FormActions({ isBusy, onCancel }: any) {
  return (
    <div className="flex items-center justify-end gap-3 border-t pt-8">
      <button type="button" onClick={onCancel} className="rounded-xl px-6 py-3 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all">Discard</button>
      <button type="submit" disabled={isBusy} className="flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700 transition-all disabled:opacity-50">
        {isBusy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Save Changes
      </button>
    </div>
  );
}