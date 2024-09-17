import Carousel from 'react-multi-carousel';
import 'react-multi-carousel/lib/styles.css';

export const Statistics = () => {
  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };

  return (
    <section className="stats" id="stats">
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className="stat-bx wow zoomIn">
                        <h2>Statistics</h2>
                        <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry.<br></br> Lorem Ipsum has been the industry's standard dummy text.</p>
                        <Carousel responsive={responsive} infinite={true} className="owl-carousel owl-theme stat-slider">
                            <div className="item">
                                <img src={''} alt="Image" />
                                <h5>Number of Users</h5>
                            </div>
                            <div className="item">
                                <img src={''} alt="Image" />
                                <h5>Number of items sold to date</h5>
                            </div>
                            <div className="item">
                                <img src={''} alt="Image" />
                                <h5>Placeholder</h5>
                            </div>
                            <div className="item">
                                <img src={''} alt="Image" />
                                <h5>Placeholder</h5>
                            </div>
                        </Carousel>
                    </div>
                </div>
            </div>
        </div>
        {/* <img className="background-image-left" src={''} alt="Image" /> */}
    </section>
  )
}