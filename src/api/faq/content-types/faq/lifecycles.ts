export default {
    async afterCreate(event) {    // Connected to "Save" button in admin panel
        const { result } = event;

        try{
            await strapi.plugins['email'].services.email.send({
              to: 'tak@add-values.com',
              from: 'tak@add-values.com', // e.g. single sender verification in SendGrid
              cc: 'tak@add-values.com',
              bcc: 'tak@add-values.com',
              //replyTo: 'valid email address',
              subject: 'The Strapi Email plugin worked successfully',
              text: '${fieldName}', // Replace with a valid field ID
              html: 'Hello world!', 
                
            })
        } catch(err) {
            console.log(err);
        }
    }
}