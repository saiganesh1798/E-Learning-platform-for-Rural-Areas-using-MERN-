const url = 'https://youtu.be/RabiCokhr68?si=kOXDnBbyplpdycLw';
const ytRegExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/|live\/)|youtu\.be\/)([^"&?\/\s]{11})/i;
const ytMatch = url.match(ytRegExp);
console.log(ytMatch);
