export interface EmailTemplate<TParams> {
  subject(params: TParams): string;
  render(params: TParams): string;
}
