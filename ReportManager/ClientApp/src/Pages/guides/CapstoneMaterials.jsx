import React from 'react';

const CapstoneMaterials = () => {
    return (
        < div >
            < h1 > Capstone Materials</ h1 >
            < ul >
                < li >< a href = "#application-design-document" > Application Design Document</ a ></ li >
                < li >< a href = "#test-plan" > Test Plan </ a ></ li >
                < li >< a href = "#admin-setup-guide" > Admin Setup Guide</ a ></ li >
                < li >< a href = "#user-guide" > User Guide </ a ></ li >
            </ ul >
            {/* Example subsection for a guide */}
            < section id = "application-design-document" >
                < h2 > Application Design Document</ h2 >
                < p > Guide content...</ p >
            </ section >
            {/* Additional sections for other guides */}
        </ div >
    );
};

export default CapstoneMaterials;