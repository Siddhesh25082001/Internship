const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Customer = require('../models/customer');
const Batch = require('../models/batch');

const maxAge = 30*24*60*60;
const stripe = require('stripe')('sk_test_51MFC0ySFryg082dBSaX2vVFFdMgRD4QrgM6y7MxAIRLxPhz8AelYsjus1zvK2yA39oF3AqCGgsn9jjzgktlHlorB00sxmWNve6');

const addCustomer = async (req, res) => {

    console.log('Body', req.body);

    try {
        const { email, password, age, batch } = req.body;

        const isCustomerExist = await Customer.find({ email: email })

        if (isCustomerExist.length) {
            req.flash('error', 'Customer already exists!')
            return res.redirect('/api/register');
        }
            
        if (age < 18 || age > 65) {
            req.flash('error', 'Age of the Customer must be between 18-65 (Both included)')
            return res.redirect('/api/register');
        }

        if (batch === '-1') {
            req.flash('error', 'Select a Valid Batch Timing')
            return res.redirect('/api/register');
        }
        
        req.body.password = await bcrypt.hash(password, 10);
        const customer = await Customer.create(req.body);
    
        if (customer) {
            const isBatchExists = await Batch.find({ type: batch })

            const data = {
                name: customer.name,
                email: customer.email,
                age: customer.age
            }

            if (isBatchExists.length) {
                const isUpdated = await Batch.updateOne(
                    {type: batch},
                    {
                        $push: {
                            members: data
                        },
                        $inc: {
                            count: 1
                        }
                    },
                )   

                if (isUpdated) console.log('Customer Added to the Batch');
                else console.log('Error');
            }

            req.flash('success', "Registration Successfull, Login with your Email and Password !!");
            return res.redirect('/api/login');
        }
        else {
            req.flash('error', 'Some Error occured !!!');
            return res.redirect('/api/register');
        }
     }

     catch (error) {
        console.log(error);
        req.flash('error', error);
        return res.redirect('/api/register');
     }
}

const updateCustomer = async (req, res) => {

    try {
        const { batch } = req.body;

        const decoded = await jwt.verify(req.cookies.jwt, 'yoga-secret');
        const decodedData = await Customer.find({ email: decoded.email });
        
        const email = decodedData[0].email;
        const previousBatch = decodedData[0].batch;

        const data = {
            name: decodedData[0].name,
            email: decodedData[0].email,
            age: decodedData[0].age
        }

        if (batch === '-1') {
            req.flash('error', 'Select a Valid Batch Timing')
            return res.redirect('/api/dashboard');
        }

        if (batch === previousBatch) {
            req.flash('error', 'Same Batch Chosen as Previous Batch')
            return res.redirect('/api/dashboard');
        }

        const isCustomerExist = await Customer.find({ email: email });
        
        var isCustomerUpdated, isPrevBatchUpdated, isCurBatchUpdated;

        if (isCustomerExist) {
            isCustomerUpdated = await Customer.update(
                {email: email},
                {
                    $set: {
                        batch: batch
                    }
                } 
            )

            const isPrevBatchExists = await Batch.find({ type: previousBatch })
            if (isPrevBatchExists.length) { 
                isPrevBatchUpdated = await Batch.updateOne(
                    {type: previousBatch},
                    {
                        $pull: {
                            members: data
                        },
                        $inc: {
                            count: -1
                        }
                    },
                )   
            }

            const isCurBatchExists = await Batch.find({ type: batch })
            if (isCurBatchExists.length) { 
                isCurBatchUpdated = await Batch.updateOne(
                    {type: batch},
                    {
                        $push: {
                            members: data
                        },
                        $inc: {
                            count: 1
                        }
                    },
                )   
            }
            
            if (isCustomerUpdated && isPrevBatchUpdated && isCurBatchUpdated) {
                req.flash('success', 'Customer Batch updated successfully !!!');
                res.redirect('/api/dashboard');
            }
            else {
                req.flash('error', 'Some error occured in updating !!!');
                res.redirect('/api/dashboard');
            }
        }
        else {
            req.flash('error', 'Customer does not exist !!!');
            res.redirect('/api/dashboard');
        }
    }
    catch (error) {
        console.log(error);
        req.flash('error', 'Some Error occured !!!');
        res.redirect('/api/dashboard');
    }
}

const login = async (req, res) => {

    console.log('Body', req.body);
    
    try {
        const { email, password } = req.body;
        
        const isCustomerExists = await Customer.find({ email: email });
        
        if (isCustomerExists) {

            const is_match = await bcrypt.compare(password, isCustomerExists[0].password);
           
            if (is_match) {
                const token = await jwt.sign({ email }, 'yoga-secret', { expiresIn: '30d' });     
                res.cookie('jwt', token, {maxAge: maxAge * 1000});
                req.flash('success', "Login Successfull !!");
                res.redirect('/api/dashboard');
            }
            else {
                req.flash('error', "Incorrect Email or Password !!!");
                res.redirect('/api/login');
            }
        }
        else {
            req.flash('error', "Customer does not exists !!!");
            res.redirect('/api/login');
        }
    } 
    catch (err) {
        console.log(err);
        req.flash('error', 'Some Error occured !!!');
        req.redirect('/api/login');
    }
}

const goToDashboard = async (req, res) => {

    try {
        const decoded = await jwt.verify(req.cookies.jwt, 'yoga-secret');
        let data = await Customer.find({ email: decoded.email });
        
        const todayDate = new Date().getDate();
        const totaldays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        const remainingDays = totaldays - todayDate;

        res.render('dashboard', {data: data, remainingDays: remainingDays});
    }
    
    catch (err) {
        console.log(err);
        req.flash('error', 'Invalid Credentials');
        res.redirect('/api/login');
    }

}

const logout = (req, res) => {
    res.cookie('jwt', '', {maxAge: 1});
    req.flash('success', 'Logged out successfully !!!');
    res.redirect('/api/login');
}

const payment = async(req, res) => {

    const storeItems = new Map(
        [
            [1, { priceInCents: 50000, name: "Yoga Subscription" }],
        ]
    )

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: req.body.items.map(item => {
                const storeItem = storeItems.get(item.id)
                return {
                    price_data: {
                        currency: "inr",
                        product_data: {
                            name: storeItem.name,
                        },
                        unit_amount: storeItem.priceInCents,
                    },
                    quantity: item.quantity,
                }
            }),
            success_url: `http://localhost:3000/api/register`,
            cancel_url: `http://localhost:3000/api/register`,
        })
        res.json({ url: session.url })
    } 
    catch (e) {
        res.status(500).json({ error: e.message })
    }
}

module.exports = {
    addCustomer,
    updateCustomer,
    login,
    logout,
    goToDashboard,
    payment
};