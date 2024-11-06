import React from 'react';
import { Banner, Statistics } from '../../Common';


function Marketplace() {
    return (
        <div>
            <Banner
                title="The Marketplace"
                description="Here are our featured listings."
            />
            <Statistics />
        </div>
    );
}

export default Marketplace;
