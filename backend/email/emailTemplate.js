
const emailTemplate = (adminName, embassyUserName, embassyUserEmail, date, count) => {
    return `
      <p>Hi ${adminName},</p>
  
      <p>
        The number of Foreign Visit Requests made by <strong>${embassyUserName}</strong> (${embassyUserEmail}) on 
        <strong>${date}</strong> has been higher than usual.
        <br><br>
        <strong>Total Foreign Visits Submitted: ${count}</strong>
        <br><br>
        Please log into the system to see more details.
      </p>
  
      <p>Thank you,<br/>Foreign Visit Monitoring System</p>
    `;
};

export default emailTemplate;
