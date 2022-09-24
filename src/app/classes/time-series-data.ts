export class TimeSeriesData {
  time = new Date()
  value: number
  constructor(value: number, time?: Date) {
    this.value = value
    if (time) {
      this.time = time
    }
  }
}
