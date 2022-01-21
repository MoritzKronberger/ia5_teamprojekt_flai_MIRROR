import moment, { DurationInputArg1, DurationInputArg2, Moment } from 'moment'
import { reactive, readonly } from 'vue'
import { jsonAction } from '../common/service/rest'
import exerciseData from './exercisedata'
import userdata from './userdata'
import 'moment/dist/locale/de'
moment.locale()
export interface UserStatistic {
  activeStreak: number | undefined
  longestStreak:
    | {
        streak: number
        start_day: string
        end_day: string
        user_id: string
      }
    | undefined
  exerciseCompletion: number | undefined
  bestExerciseSign: string | undefined
  timeLearntToday: string | undefined
}

export interface TrendsEntry {
  x: string
  y: number
}

export interface TrendsRow {
  day: string
  time_learnt: object
}

export interface TrendsDataset {
  labels: string[]
  values: number[]
}

export interface Trends {
  end_day: string
  days: number
  dataset: TrendsDataset | undefined
}

const userStatistic: UserStatistic = reactive({
  activeStreak: undefined,
  longestStreak: undefined,
  exerciseCompletion: undefined,
  bestExerciseSign: undefined,
  timeLearntToday: undefined,
})

const trends: Trends = reactive({
  end_day: moment().toString(),
  days: 7,
  dataset: undefined,
})

const methods = {
  changeUserStatistic(newStatistic: UserStatistic) {
    Object.assign(userStatistic, newStatistic)
    console.log(userStatistic)
  },
  changeTrends(
    trendsData: { status: number; data: { rows: TrendsRow[] } },
    dateFormat = 'YYYY-MM-DD'
  ) {
    // create a datset with trends.days days ending on endDay as x and an initial y (time_learnt) of 0
    const baseDataset: TrendsEntry[] = []
    const endDay = moment(trends.end_day)
    for (let i = 0; i < trends.days; i++) {
      const x = endDay
        .subtract(i === 0 ? 0 : 1, 'days')
        .format(dateFormat)
        .toString()
      baseDataset.push({ x: x, y: 0 })
    }

    // convert the fetched rows into the TrendsDataset type and match the date formatting
    if (trendsData.data.rows) {
      const trendsDataDataset: TrendsEntry[] = trendsData.data.rows.map(
        (entry) => {
          return {
            x: moment(entry.day).format(dateFormat).toString(),
            y: moment.duration(entry.time_learnt).asMinutes(),
          } as TrendsEntry
        }
      )

      // find the entries where the day matches the database row and replace them with the row
      // from https://stackoverflow.com/a/37585362/14906871
      const dataset = baseDataset.map(
        (entry) => trendsDataDataset.find((e) => e.x === entry.x) || entry
      )
      const labels = dataset.map((entry) => moment(entry.x).format('dd'))
      const values = dataset.map((entry) => entry.y)
      console.log(moment(labels[0]))
      trends.dataset = {
        labels: labels,
        values: values,
      }
    }
  },
  changeTrendsEndDay(endDay: Moment) {
    trends.end_day = endDay.toString()
  },

  changeTrendsEndDayByInterval(
    method: string,
    interval: DurationInputArg1,
    intervaltype: DurationInputArg2
  ) {
    if (method.toLowerCase() === 'add')
      trends.end_day = moment(trends.end_day)
        .add(interval, intervaltype)
        .toString()
    else if (method.toLowerCase() === 'subtract')
      trends.end_day = moment(trends.end_day)
        .subtract(interval, intervaltype)
        .toString()
    console.log('end day ' + trends.end_day)
  },
}

const actions = {
  async getUserStatistic() {
    const userId = userdata.user.id
    const exerciseId = exerciseData.exercises[0].id
    const today = moment()

    const activeStreakData = await jsonAction({
      method: 'get',
      url: 'statistic/active_streak',
      data: { user_id: userId },
    })
    const longestStreakData = await jsonAction({
      method: 'get',
      url: 'statistic/longest_streak',
      data: { user_id: userId },
    })
    const exerciseCompletionData = await jsonAction({
      method: 'get',
      url: 'statistic/exercise_completion',
      data: { user_id: userId, exercise_id: exerciseId },
    })
    const bestExerciseSignData = await jsonAction({
      method: 'get',
      url: 'statistic/best_exercise_sign',
      data: { user_id: userId, exercise_id: exerciseId },
    })
    const timeLearntTodayData = await jsonAction({
      method: 'get',
      url: 'statistic/time_learnt_by_day',
      data: { user_id: userId, day: today.format('YYYY-MM-DD').toString() },
    })

    const newUserStatistic: UserStatistic = {
      activeStreak: activeStreakData.data.rows?.[0].streak,
      longestStreak: { ...longestStreakData.data.rows?.[0] },
      exerciseCompletion:
        exerciseCompletionData.data.rows?.[0].progress_completion,
      bestExerciseSign: bestExerciseSignData.data.rows?.[0].sign_name,
      timeLearntToday: timeLearntTodayData.data.rows?.[0].time_learnt,
    }

    methods.changeUserStatistic(newUserStatistic)
    await this.updateTrendsData()
  },
  async updateTrendsData() {
    const userId = userdata.user.id

    const trendsData = await jsonAction({
      method: 'get',
      url: 'statistic/trends',
      data: {
        user_id: userId,
        end_day: moment(trends.end_day).format('YYYY-MM-DD').toString(),
        days: trends.days,
      },
    })

    methods.changeTrends(trendsData)
  },
}

const statisticdata = {
  userStatistic: readonly(userStatistic) as UserStatistic,
  trends: readonly(trends) as Trends,
  methods,
  actions,
}

export default statisticdata
