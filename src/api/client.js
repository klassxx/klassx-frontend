/**
 * Thin wrapper around fetch() for the KLASSX Django API.
 * Handles JWT storage, attaching the Authorization header, and a single
 * automatic retry after refreshing an expired access token.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function getTokens() {
  return {
    access: localStorage.getItem("klassx_access"),
    refresh: localStorage.getItem("klassx_refresh"),
  };
}

export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem("klassx_access", access);
  if (refresh) localStorage.setItem("klassx_refresh", refresh);
}

export function clearTokens() {
  localStorage.removeItem("klassx_access");
  localStorage.removeItem("klassx_refresh");
}

export function isAuthenticated() {
  return Boolean(getTokens().access);
}

async function refreshAccessToken() {
  const { refresh } = getTokens();
  if (!refresh) return false;

  const res = await fetch(`${BASE_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) {
    // The refresh token itself is dead (expired, or from an old test
    // session) — clear both tokens now instead of leaving them in
    // localStorage. Otherwise the dead access token keeps getting
    // attached to every request (even AllowAny/public ones — DRF treats
    // an invalid Bearer token as a hard 401, not "treat as anonymous"),
    // and every component fetching data independently repeats this same
    // failed refresh attempt on its own instead of just going out
    // unauthenticated like a first-time visitor would.
    clearTokens();
    return false;
  }

  const data = await res.json();
  setTokens({ access: data.access });
  return true;
}

/**
 * @param {string} path - e.g. "/subjects/"
 * @param {object} options - fetch options; body will be JSON-stringified if it's a plain object
 */
export async function apiFetch(path, options = {}) {
  const { access } = getTokens();
  const isFormData = options.body instanceof FormData;

  const headers = { ...options.headers };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (access) headers.Authorization = `Bearer ${access}`;

  const body = !isFormData && options.body && typeof options.body === "object"
    ? JSON.stringify(options.body)
    : options.body;

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers, body });

  if (res.status === 401 && (await refreshAccessToken())) {
    const retryHeaders = { ...headers, Authorization: `Bearer ${getTokens().access}` };
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers: retryHeaders, body });
  }

  if (!res.ok) {
    let detail = "Une erreur est survenue.";
    try {
      const errData = await res.json();
      detail = errData.detail || JSON.stringify(errData);
    } catch {
      // response wasn't JSON — keep the default message
    }
    throw new Error(detail);
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (payload) => apiFetch("/auth/register/", { method: "POST", body: payload }),
  registerTeacher: (payload) => apiFetch("/auth/register-teacher/", { method: "POST", body: payload }),
  registerAffiliate: (payload) => apiFetch("/auth/register-affiliate/", { method: "POST", body: payload }),
  requestPasswordReset: (email) => apiFetch("/auth/password-reset/", { method: "POST", body: { email } }),
  confirmPasswordReset: (payload) => apiFetch("/auth/password-reset/confirm/", { method: "POST", body: payload }),
  setupPaymentMethod: () => apiFetch("/me/payment-method/setup/", { method: "POST" }),
  login: (payload) => apiFetch("/auth/login/", { method: "POST", body: payload }),

  // --- Public landing page (no auth needed) ---
  publicTeachers: () => apiFetch("/public/teachers/"),
  publicTeacherDetail: (id) => apiFetch(`/public/teachers/${id}/`),
  publicPricing: () => apiFetch("/public/pricing/"),
  publicFAQ: () => apiFetch("/public/faq/"),
  staticPage: (slug) => apiFetch(`/public/pages/${slug}/`),
  subscribeNewsletter: (email) => apiFetch("/public/newsletter/", { method: "POST", body: { email } }),
  me: () => apiFetch("/me/"),
  myReferrals: () => apiFetch("/me/referrals/"),
  myTeacherHours: (month) => apiFetch(`/me/teacher-hours/${month ? `?month=${month}` : ""}`),
  subjects: (params = "") => apiFetch(`/subjects/${params}`),
  updateSpecialties: (payload) => apiFetch("/me/specialties/", { method: "PATCH", body: payload }),
  classSessions: (params = "") => apiFetch(`/class-sessions/${params}`),
  myEnrollments: () => apiFetch("/enrollments/"),
  createEnrollment: (classSessionId) =>
    apiFetch("/enrollments/", { method: "POST", body: { class_session: classSessionId } }),
  cancelEnrollment: (id) => apiFetch(`/enrollments/${id}/cancel/`, { method: "POST" }),
  selfStudyPlans: () => apiFetch("/selfstudy-plans/"),
  selfStudyContent: (params = "") => apiFetch(`/selfstudy-content/${params}`),
  selfStudyPlaybackUrl: (itemId) => apiFetch(`/selfstudy-content/${itemId}/playback_url/`),
  selfStudyDownloadUrl: (itemId) => apiFetch(`/selfstudy-content/${itemId}/download_url/`),
  markSelfStudyProgress: (itemId, progress_percentage) =>
    apiFetch(`/selfstudy-content/${itemId}/progress/`, { method: "POST", body: { progress_percentage } }),
  subscriptionCheckout: (planId) => apiFetch("/subscriptions/checkout/", { method: "POST", body: { plan_id: planId } }),
  enrollmentCheckout: (enrollmentId) =>
    apiFetch(`/enrollments/${enrollmentId}/create_checkout_session/`, { method: "POST" }),

  // --- Group requests (new booking flow: student requests, admin schedules) ---
  myGroupRequests: () => apiFetch("/group-requests/"),
  createGroupRequest: (payload) => apiFetch("/group-requests/", { method: "POST", body: payload }),
  createIndividualBooking: (payload) => apiFetch("/individual-bookings/", { method: "POST", body: payload }),
  cancelGroupRequest: (id) => apiFetch(`/group-requests/${id}/cancel/`, { method: "POST" }),
  pendingGroupSummary: () => apiFetch("/group-requests/pending_summary/"),
  pendingGroupRequests: (params = "") => apiFetch(`/group-requests/?status=pending${params}`),
  scheduleGroup: (payload) => apiFetch("/admin/schedule-group/", { method: "POST", body: payload }),
  assignGroupToTeacher: (payload) => apiFetch("/admin/assign-group/", { method: "POST", body: payload }),

  // --- Group assignments (autonomous scheduling: teacher picks day/time/link) ---
  myGroupAssignments: (params = "") => apiFetch(`/group-assignments/${params}`),
  scheduleGroupAssignment: (id, payload) =>
    apiFetch(`/group-assignments/${id}/schedule/`, { method: "POST", body: payload }),

  // --- Series memberships (recurring fixed groups: monthly billing, 2-week notice to leave) ---
  mySeriesMemberships: () => apiFetch("/series-memberships/"),
  seriesMembershipCheckout: (id) => apiFetch(`/series-memberships/${id}/checkout/`, { method: "POST" }),
  leaveSeriesMembership: (id) => apiFetch(`/series-memberships/${id}/leave/`, { method: "POST" }),

  // --- Forum ---
  forumThreads: (params = "") => apiFetch(`/forum/threads/${params}`),
  forumThread: (id) => apiFetch(`/forum/threads/${id}/`),
  createForumThread: (payload) => apiFetch("/forum/threads/", { method: "POST", body: payload }),
  markThreadSolved: (id) => apiFetch(`/forum/threads/${id}/mark_solved/`, { method: "POST" }),
  forumReplies: (threadId) => apiFetch(`/forum/replies/?thread=${threadId}`),
  createForumReply: (threadId, body) => apiFetch("/forum/replies/", { method: "POST", body: { thread: threadId, body } }),

  // --- Admin ---
  adminStats: () => apiFetch("/admin/stats/"),
  teacherHours: (month) => apiFetch(`/admin/teacher-hours/${month ? `?month=${month}` : ""}`),
  adminReferrals: () => apiFetch("/admin/referrals/"),
  markReferralPaid: (referrerId, currency) =>
    apiFetch(`/admin/referrals/${referrerId}/mark-paid/?currency=${currency}`, { method: "POST" }),
  unassignedSessions: () => apiFetch("/class-sessions/?status=scheduled"),
  assignTeacher: (sessionId, teacherId) =>
    apiFetch(`/class-sessions/${sessionId}/assign_teacher/`, { method: "POST", body: { teacher_id: teacherId } }),
  allTeachers: () => apiFetch("/teachers/"),
  pendingTeachers: () => apiFetch("/teachers/?is_active=false"),
  approveTeacher: (teacherId) => apiFetch(`/teachers/${teacherId}/approve/`, { method: "POST" }),
  rejectTeacher: (teacherId) => apiFetch(`/teachers/${teacherId}/reject/`, { method: "POST" }),

  // --- Teacher ---
  mySessions: () => apiFetch("/class-sessions/mine/"),
  addExtraSession: (payload) => apiFetch("/class-sessions/add_extra_session/", { method: "POST", body: payload }),
  myTeacherSettings: () => apiFetch("/teachers/me/"),
  updateTeacherSettings: (payload) => apiFetch("/teachers/me/", { method: "PATCH", body: payload }),
  connectGoogle: () => apiFetch("/teachers/me/google/connect/"),
  disconnectGoogle: () => apiFetch("/teachers/me/google/disconnect/", { method: "POST" }),

  // --- Group content (documents, video links) & announcements ---
  // target is { group_assignment: id } or { class_session: id } — exactly one.
  groupMaterials: (groupAssignmentId) => apiFetch(`/materials/?group_assignment=${groupAssignmentId}`),
  sessionMaterials: (classSessionId) => apiFetch(`/materials/?class_session=${classSessionId}`),
  uploadMaterial: (target, title, file) => {
    const formData = new FormData();
    if (target.group_assignment) formData.append("group_assignment", target.group_assignment);
    if (target.class_session) formData.append("class_session", target.class_session);
    formData.append("content_type", "document");
    formData.append("title", title);
    formData.append("file", file);
    return apiFetch("/materials/", { method: "POST", body: formData });
  },
  addVideoLink: (target, title, url) =>
    apiFetch("/materials/", { method: "POST", body: { ...target, content_type: "video_link", title, url } }),
  deleteMaterial: (id) => apiFetch(`/materials/${id}/`, { method: "DELETE" }),
  groupAnnouncements: (groupAssignmentId) => apiFetch(`/group-announcements/?group_assignment=${groupAssignmentId}`),
  postGroupAnnouncement: (groupAssignmentId, message) =>
    apiFetch("/group-announcements/", { method: "POST", body: { group_assignment: groupAssignmentId, message } }),
  deleteGroupAnnouncement: (id) => apiFetch(`/group-announcements/${id}/`, { method: "DELETE" }),
};
