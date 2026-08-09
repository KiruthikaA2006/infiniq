export type CoreState =
  | "idle"
  | "listening"
  | "thinking"
  | "analyzing"
  | "synthesizing"
  | "understanding"
  | "follow-up"
  | "complete"
  | "completed";

export interface TheCoreProps {
  state?: CoreState;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export type InfiniQCoreProps = TheCoreProps;
