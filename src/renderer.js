const datapoints = []
const labels = []
let chart = undefined

let offset = 150
let pwmResolution = 4096
let steps = 256

const offsetEl = document.getElementById('offset')
offsetEl.addEventListener('change', (e) => {
  offset = toUInt(e)
  offsetEl.value = offset
  updateData()
  updateChart()
})
const pwmResolutionEl = document.getElementById('pwmResolution')
pwmResolutionEl.addEventListener('change', (e) => {
  pwmResolution = toUInt(e)
  pwmResolutionEl.value = pwmResolution
  updateData()
  chart.options.scales.y.suggestedMax = pwmResolution
  updateChart()
})
const stepsEl = document.getElementById('steps')
stepsEl.addEventListener('change', (e) => {
  steps = toUInt(e)
  stepsEl.value = steps
  updateData()
  updateChart()
})

function toUInt(e) {
  const x = e.target.value
  try {
    let v = parseInt(x)
    if (isNaN(v)) {
      return 0
    }
    if (v < 0) {
      return 0
    }
    return v
  } catch (ex) {
    //ignore
  }
  return 0
}

function updateData() {
  const y0 = calc(0, offset, steps, pwmResolution)

  const l = chart.data.labels
  const d = chart.data.datasets[0].data
  d.length = 0
  l.length = 0
  for (let i = 0; i < steps; ++i) {
    const f = 1 - i / steps
    const y = calc(i, offset, steps, pwmResolution) - y0 * f
    l.push(i)
    d[i] = y
  }
}

function generateCode() {
  const indent = '  '
  let result = ''
  result += `// steps: ${steps}, offset: ${offset}, pwmResolution: ${pwmResolution}\n`
  result += `const uint16_t pwmtable_${pwmResolution}[${steps}] PROGMEM = {\n`

  const y0 = calc(0, offset, steps, pwmResolution)

  let line = ''
  const valuesPerLine = 16
  let count = 0
  for (let i = 0; i < steps; ++i) {
    ++count
    const f = 1 - i / steps
    const y = calc(i, offset, steps, pwmResolution) - y0 * f
    line += y.toFixed()
    if (i !== steps - 1) {
      line += ', '
    }
    if (count === valuesPerLine) {
      count = 0
      result = result + indent + line + '\n'
      line = ''
    }
  }

  if (line.length > 0) {
    result = result + indent + line + '\n'
  }

  result += '};\n'
  return result
}

function updateChart() {
  if (chart) {
    chart.update()
  }
}

function calc(i, off, steps, pwmResolution) {
  const x = i + off
  const last = steps + off
  return Math.pow(2, (Math.log2(pwmResolution - 1) * (x + 1)) / last)
}

function initChart() {
  const ctx = document.getElementById('myChart')

  const data = {
    labels: [],
    datasets: [
      {
        label: 'Dimming curve',
        data: [],
        borderColor: '#0f0',
        fill: false
      }
    ]
  }

  const config = {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      legend: {
        display: false
      },
      interaction: {
        intersect: false
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: 'from'
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'to'
          },
          suggestedMin: 0,
          suggestedMax: 4096
        }
      }
    }
  }
  // eslint-disable-next-line no-undef
  chart = new Chart(ctx, config)
}

const generateEl = document.getElementById('generate')
generateEl.addEventListener('click', () => {
  window.electronAPI.save(generateCode())
})
;(async () => {
  window.addEventListener('DOMContentLoaded', () => {
    initChart()
    updateData()
    updateChart()
  })
})()
