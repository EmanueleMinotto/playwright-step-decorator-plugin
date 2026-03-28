export interface StepOptions {
  /** Box the step in the report so errors point to the call site. Defaults to false. */
  box?: boolean;
  /** Maximum time in milliseconds for the step to finish. */
  timeout?: number;
  /**
   * Skip humanization — use the raw "ClassName.methodName" format as the step title,
   * with no parameter rendering. Defaults to false.
   */
  noHumanizer?: boolean;
}
