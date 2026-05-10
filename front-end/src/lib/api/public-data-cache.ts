import { cache } from "react";
import { unstable_cache } from "next/cache";

import {
  getPublicBlogPosts,
  getPublicJobMapMarkers,
  getPublicJobs,
} from "./public-api";

const getPublicJobsInner = unstable_cache(
  async (page: number, limit: number) => getPublicJobs(page, limit),
  ["public-jobs"],
  { revalidate: 60 },
);

/** Cross-request + single-render dedupe for public job lists (RSC). */
export const getPublicJobsCached = cache(getPublicJobsInner);

const getPublicBlogPostsInner = unstable_cache(
  async (page: number, limit: number) => getPublicBlogPosts(page, limit),
  ["public-blog-posts"],
  { revalidate: 120 },
);

export const getPublicBlogPostsCached = cache(getPublicBlogPostsInner);

const getPublicJobMapMarkersInner = unstable_cache(
  async (limit: number) => getPublicJobMapMarkers(limit),
  ["public-job-map-markers"],
  { revalidate: 120 },
);

export const getPublicJobMapMarkersCached = cache(getPublicJobMapMarkersInner);
