export type ContentEntry<T = any> = {
  id: string;
  slug?: string;
  body?: string;
  data: T;
  render?: any;
};
