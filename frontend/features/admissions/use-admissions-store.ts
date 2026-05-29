"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type AdvancedFilters = {
  nirfRankMin: string;
  nirfRankMax: string;
  placementPctMin: string;
  hostelAvailable: string;
  autonomous: string;
  avgPackageMin: string;
  campusType: string;
  naacGrade: string;
};

type AdmissionsState = {
  collegeQuery: string;
  districtFilter: string;
  selectedCategory: string;
  recentSearches: string[];
  showAdvancedFilters: boolean;
  advancedFilters: AdvancedFilters;
  compareIds: string[];
  setCollegeQuery: (collegeQuery: string) => void;
  setDistrictFilter: (district: string) => void;
  setSelectedCategory: (selectedCategory: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  toggleAdvancedFilters: () => void;
  setAdvancedFilter: (key: keyof AdvancedFilters, value: string) => void;
  resetAdvancedFilters: () => void;
  toggleCompareId: (id: string) => void;
  clearCompareIds: () => void;
};

const defaultFilters: AdvancedFilters = {
  nirfRankMin: "",
  nirfRankMax: "",
  placementPctMin: "",
  hostelAvailable: "",
  autonomous: "",
  avgPackageMin: "",
  campusType: "",
  naacGrade: "",
};

export const useAdmissionsStore = create<AdmissionsState>()(
  persist(
    (set) => ({
      collegeQuery: "",
      districtFilter: "",
      selectedCategory: "GM",
      recentSearches: [],
      showAdvancedFilters: false,
      advancedFilters: { ...defaultFilters },
      compareIds: [],
      setCollegeQuery: (collegeQuery) => set({ collegeQuery }),
      setDistrictFilter: (districtFilter) => set({ districtFilter }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      addRecentSearch: (query) =>
        set((state) => {
          const trimmed = query.trim();
          if (!trimmed) return state;
          const filtered = state.recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
          return { recentSearches: [trimmed, ...filtered].slice(0, 8) };
        }),
      clearRecentSearches: () => set({ recentSearches: [] }),
      toggleAdvancedFilters: () => set((state) => ({ showAdvancedFilters: !state.showAdvancedFilters })),
      setAdvancedFilter: (key, value) => set((state) => ({
        advancedFilters: { ...state.advancedFilters, [key]: value }
      })),
      resetAdvancedFilters: () => set({ advancedFilters: { ...defaultFilters } }),
      toggleCompareId: (id) => set((state) => ({
        compareIds: state.compareIds.includes(id)
          ? state.compareIds.filter((cid) => cid !== id)
          : [...state.compareIds, id].slice(0, 5)
      })),
      clearCompareIds: () => set({ compareIds: [] })
    }),
    {
      name: "gradifyai-admissions",
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        districtFilter: state.districtFilter,
        advancedFilters: state.advancedFilters,
        compareIds: state.compareIds
      })
    }
  )
);

export type { AdvancedFilters };
