export interface GaugeRunRepositoryInterface {
  runGauges(args: readonly string[]): Promise<number>;
}
