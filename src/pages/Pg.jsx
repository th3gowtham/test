import React from "react";
import { Link } from "react-router-dom";
import "../styles/all.min.css";
import "../styles/bootstrap.min.css";
import "../styles/swiper-bundle.min.css";
import "../styles/main.css";
import img2r from "../assets/2r.png";

const Pg = () => (
  <>
  
    <div className="coming-soon py-5">
      <div className="container">
        <div className="row">
          <div className="col-12 text-center">
            <h2>The page is under construction</h2>
          </div>
        </div>
        <div className="row justify-content-center mt-4">
          <div className="col-12 d-flex justify-content-center">
            <svg viewBox="0 0 500 500" width="350" height="350">
              <defs>
                <symbol id="bee" viewBox="0 0 170 100">
                  <g transform="translate(5 5)">
                    <path d="M 0 45 a 45 45 0 0 1 45 -45 h 80 a 25 25 0 0 1 25 25 q -45 65 -105 65 a 45 45 0 0 1 -45 -45" fill="#ffcd12" stroke="#000" strokeWidth="10" strokeLinecap="round"></path>
                    <path d="M 5 45 a 40 40 0 0 0 45 40 q 60 0 105 -65 q -45 45 -105 60 a 50 50 0 0 1 -45 -40" fill="#c57a00" opacity="0.5"></path>
                    <path d="M 5 45 a 40 40 0 0 1 40 -40 h 20 q -50 0 -60 40" fill="#fff"></path>
                    <path d="M 60 2.5 a 82 82 0 0 1 0 82" fill="none" stroke="#000" strokeWidth="15" strokeLinecap="round"></path>
                    <path d="M 90 2.5 a 74 74 0 0 1 0 74" fill="none" stroke="#000" strokeWidth="15" strokeLinecap="round"></path>
                    <path d="M 70 0 h 60 a 30 30 0 0 1 0 60 q -30 0 -60 -60" fill="#fff" stroke="#000" strokeWidth="10" strokeLinecap="round"></path>
                    <path d="M 155 30 a 20 20 0 0 1 -20 20 q -30 0 -60 -45 q 25 45 60 55 a 20 20 0 0 0 20 -20" fill="#000" opacity="0.1"></path>
                    <circle cx="38" cy="35" r="12" fill="#252222"></circle>
                    <circle cx="40" cy="32" r="4" fill="#fff"></circle>
                  </g>
                </symbol>
              </defs>
              <g transform="translate(300 300)">
                <g transform="rotate(0)">
                  <g transform="rotate(0)">
                    <g transform="translate(0 -70)">
                      <use href="#bee" width="170" height="100" transform="translate(-85 -50)" />
                    </g>
                  </g>
                </g>
                <g transform="rotate(0)">
                  <g transform="rotate(120)">
                    <g transform="translate(0 -70)">
                      <use href="#bee" width="170" height="100" transform="translate(-85 -50)" />
                    </g>
                  </g>
                </g>
                <g transform="rotate(0)">
                  <g transform="rotate(240)">
                    <g transform="translate(0 -70)">
                      <use href="#bee" width="170" height="100" transform="translate(-85 -50)" />
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default Pg; 