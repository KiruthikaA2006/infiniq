export type CoreState = 'idle' | 'listening' | 'thinking' | 'understanding' | 'complete';

export interface TheCoreProps {
  state: CoreState;
  className?: string;
}
