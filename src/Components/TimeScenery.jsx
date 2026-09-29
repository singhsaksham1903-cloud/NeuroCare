import './TimeScenery.css'

function TimeScenery({ timeOfDay }) {
  return (
    <div
      className={`time-scenery time-scenery--${timeOfDay}`}
      aria-hidden="true"
    >
      <div className="time-scenery__stars" />

      <div className="time-scenery__sun" />

      <div className="time-scenery__cloud time-scenery__cloud--one" />
      <div className="time-scenery__cloud time-scenery__cloud--two" />

      <div className="time-scenery__mountains time-scenery__mountains--back" />
      <div className="time-scenery__mountains time-scenery__mountains--front" />

      <div className="time-scenery__water">
        <div className="time-scenery__reflection" />
      </div>

      <div className="time-scenery__shore" />
    </div>
  )
}

export default TimeScenery