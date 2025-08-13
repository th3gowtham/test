import React from "react";

const CourseCard = ({
  imgSrc,
  title,
  description,
  age,
  seats,
  duration,
  fee,
  onApply,
  loading,
}) => {
  return (
    <div className="col mb-4 d-flex">
      <div className="card h-100 w-100 course-card p-3">
        <img
          src={imgSrc}
          className="card-img-top"
          alt={title}
          style={{ height: "200px", objectFit: "cover", borderRadius: "10px" }}
        />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title fw-bold text-center">{title}</h5>
          <p className="card-text course-description text-center">{description}</p>

          {/* Tabular Info Section */}
  <table className="table table-bordered text-center course-info-table mt-3">
  <tbody>
    <tr>
      <td className="fw-semibold">Age of Kids</td>
      <td>{age}</td>
    </tr>
    <tr>
      <td className="fw-semibold">Total Seats</td>
      <td>{seats}</td>
    </tr>
    <tr>
      <td className="fw-semibold">Duration</td>
      <td>{duration}</td>
    </tr>
    <tr>
      <td className="fw-semibold">Fee</td>
      <td>₹{fee}</td>
    </tr>
  </tbody>
</table>


          <button
            className="enroll-btn mt-auto mx-auto"
            onClick={onApply}
            disabled={loading}
          >
            {loading ? "Processing..." : "Enroll Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
