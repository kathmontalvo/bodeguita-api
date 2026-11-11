export type DomainErrorKind = 'VALIDATION' | 'NOT_FOUND' | 'CONFLICT';

export abstract class DomainException extends Error {
  protected constructor(
    public readonly code: string,
    public readonly kind: DomainErrorKind,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}