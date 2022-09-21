export class TimeSeriesData {
  time = new Date().getTime()
  value: number
  constructor(value: number, time?: number) {
    this.value = value
    if (time) {
      this.time = time
    }
  }
}
