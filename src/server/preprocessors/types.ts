export interface TransformConfig {
  from: string;
  to: string;
  desc: string;
  content: string;
  filename: string;
  root: string;
  options?: { [key: string]: any };
}
export interface TransformResult {
  code: string;
  map?: object | string;
  dependencies?: string[];
}
