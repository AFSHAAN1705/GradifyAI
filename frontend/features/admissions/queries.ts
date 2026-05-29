"use client";

import { useDeferredValue, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { CollegesResponse, PredictionResponse } from "@/features/admissions/types";
import type { PredictionRequest } from "@/lib/validation/admissions";

type CollegeSearchParams = {
  q?: string;
  city?: string;
  state?: string;
  branchCode?: string;
  pageSize?: number;
  nirfRankMin?: string;
  nirfRankMax?: string;
  placementPctMin?: string;
  hostelAvailable?: string;
  autonomous?: string;
  avgPackageMin?: string;
  campusType?: string;
  naacGrade?: string;
};

export function useColleges(params: CollegeSearchParams = {}) {
  const { q, city, state: st, branchCode, pageSize = 1000, nirfRankMin, nirfRankMax, placementPctMin, hostelAvailable, autonomous, avgPackageMin, campusType, naacGrade } = params;
  const deferredQ = useDeferredValue(q);
  const deferredCity = useDeferredValue(city);
  const queryKey = useMemo(() => ["colleges", deferredQ, deferredCity, st, branchCode, pageSize, nirfRankMin, nirfRankMax, placementPctMin, hostelAvailable, autonomous, avgPackageMin, campusType, naacGrade], [deferredQ, deferredCity, st, branchCode, pageSize, nirfRankMin, nirfRankMax, placementPctMin, hostelAvailable, autonomous, avgPackageMin, campusType, naacGrade]);
  return useQuery({
    queryKey,
    queryFn: () => {
      const searchParams = new URLSearchParams({ pageSize: String(pageSize) });
      if (deferredQ?.trim()) searchParams.set("q", deferredQ.trim());
      if (deferredCity?.trim()) searchParams.set("city", deferredCity.trim());
      if (st?.trim()) searchParams.set("state", st.trim());
      if (branchCode?.trim()) searchParams.set("branchCode", branchCode.trim());
      if (nirfRankMin?.trim()) searchParams.set("nirfRankMin", nirfRankMin.trim());
      if (nirfRankMax?.trim()) searchParams.set("nirfRankMax", nirfRankMax.trim());
      if (placementPctMin?.trim()) searchParams.set("placementPctMin", placementPctMin.trim());
      if (hostelAvailable === "true" || hostelAvailable === "false") searchParams.set("hostelAvailable", hostelAvailable);
      if (autonomous === "true" || autonomous === "false") searchParams.set("autonomous", autonomous);
      if (avgPackageMin?.trim()) searchParams.set("avgPackageMin", avgPackageMin.trim());
      if (campusType?.trim()) searchParams.set("campusType", campusType.trim());
      if (naacGrade?.trim()) searchParams.set("naacGrade", naacGrade.trim());
      return apiFetch<CollegesResponse>(`/api/colleges?${searchParams.toString()}`);
    },
    placeholderData: (prev) => prev
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch<{ categories: Array<{ id: string; code: string; name: string; group: string | null }> }>("/api/categories"),
    staleTime: 1000 * 60 * 30,
    placeholderData: (prev) => prev
  });
}

export function useDistricts() {
  return useQuery({
    queryKey: ["districts"],
    queryFn: () => apiFetch<{ districts: string[] }>("/api/districts"),
    staleTime: 1000 * 60 * 10,
    placeholderData: (prev) => prev
  });
}

export function usePredictAdmissions() {
  return useMutation({
    mutationFn: (payload: PredictionRequest) =>
      apiFetch<PredictionResponse>("/api/predict", {
        method: "POST",
        data: payload
      })
  });
}
