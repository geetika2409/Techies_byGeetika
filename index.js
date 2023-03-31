function sendEmail(){
    var params={
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        message: document.getElementById("message").value
    };
    const serviceId="service_fivcqlq";
const body="Name: "+document.getElementById("name").value+ "<br/> Email: "+document.getElementById("email").value+
     "<br/> Mobile Number: "+document.getElementById("phone").value+ "<br/> Message: "+document.getElementById("message").value;
 emailjs.send(serviceId,body,params)
 .then(
     res=>{
         document.getElementById("name").value="";
         document.getElementById("email").value="";
         document.getElementById("phone").value="";
         document.getElementById("message").value="";
         console.log(res);
         alert("Message sent Successfully.");
     }
 )
}