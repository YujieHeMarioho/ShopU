// src/Components/Common/Banner.js
import { Container, Row, Col } from 'react-bootstrap';
import { ArrowRightCircle } from 'react-bootstrap-icons';

export const Banner = ({ title, description }) => {
  return (
    <section className="banner" id="home">
      <Container>
        <Row className="align-items-center">
          <Col xs={12} md={6} xl={7}>
            <div>
              <h1>{title}</h1>
              <p>{description}</p>
              <button onClick={() => console.log('connect')}>
                Let’s Connect <ArrowRightCircle size={25} />
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

// Default props
Banner.defaultProps = {
  title: 'Welcome to ShopU!',
  description:
    'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry\'s standard dummy text ever since the 1500s.',
};
