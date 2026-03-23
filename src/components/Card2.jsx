import React from 'react'

const Card2 = ({ bg, text, des, number, desc, onClick }) => {
  return (
    <div className="col-md-2">
      <div className={`card ${bg} summary-card animate__animated animate__fadeInUp`} onClick={onClick}>
        <div className="card-body text-center">
          <h3 className={text}>{number}</h3>
          <p className={des}>{desc}</p>
        </div>
      </div>
    </div>
  );
};
export default Card2

