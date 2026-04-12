export type AdminActionState = {
  status: "idle" | "success" | "failed" | "error";
  title: string;
  message: string;
  timestamp: number;
};

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = {
  status: "idle",
  title: "",
  message: "",
  timestamp: 0
};
