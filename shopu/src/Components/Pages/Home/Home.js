import React from 'react';
import { Banner, Statistics } from '../../Common';


function Home() {
    return (
        <div>
            <Banner 
            title="Welcome to ShopU!"
            description={"This is a test!"}
            />
            <Statistics />
        </div>
    );
}

export default Home;
