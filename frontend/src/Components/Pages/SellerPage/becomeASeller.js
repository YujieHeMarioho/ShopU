import React from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import styles from "./BecomeASeller.module.css";

function BecomeASeller() {
  const navigate = useNavigate();
  
  return (
    <Container className={styles.container}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <h1 className={styles.heroTitle}>Become a Seller Today!</h1>
        <p className={styles.heroDescription}>
          Empower your entrepreneurial journey by joining our platform.
        </p>
        <Button className={styles.ctaButton} variant="warning">
          Join Now
        </Button>
      </section>

      {/* Benefits Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Benefits of Becoming a Seller</h2>
        <Row className={styles.cardGrid}>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Schedule Appointments</Card.Title>
                <Card.Text>
                  Easily manage appointments and availability with our platform.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Sell Old Goods</Card.Title>
                <Card.Text>
                  Clear out your dorm or apartment by selling unused items.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Entrepreneurial Growth</Card.Title>
                <Card.Text>
                  Build your business and reputation within the campus community.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </section>

      {/* What Becoming a Seller Entails Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What Becoming a Seller Entails</h2>
        <ul className={styles.list}>
          <li>Gathering a following from students for your items.</li>
          <li>Effortless management of your products on our platform.</li>
          <li>
            Flexible delivery options: on-campus pickup, off-campus, or through
            our platform.
          </li>
        </ul>
      </section>

      {/* How to Become a Seller Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>How to Become a Seller</h2>
        <p className={styles.text}>
          To become a seller, you must be a current University student and
          registered on the platform.
        </p>
        <div className={styles.ctaContainer}>
        <Button
            className={styles.startButton}
            variant="primary"
            onClick={() => navigate("/seller-dashboard")}
          >Start My Business Journey</Button>
          <p className={styles.comingSoon}>More features coming soon!</p>
        </div>
      </section>
    </Container>
  );
}

export default BecomeASeller;
