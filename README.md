<a href="https://github.com/shamilkotta/offpitch_Backend"><h1><b>offpitch</b></h1></a>
<br>
<a href="https://github.com/shamilkotta/offpitch_Backend">
<img src="https://img.shields.io/badge/status-active-success.svg" alt="Status">
</a>

## **About**

offpitch is a webplatform for managing football tournaments. Here users can host tournaments and manage the teams, matches, table, points ...etc. And for the teams they can create a club page, add players and then they can register for the tournaments. Also the tournament host can sell the ticket to the tournament through this platform

<!-- ![image](https://user-images.githubusercontent.com/64640025/211061221-cdd72a97-87b0-4ae9-a66e-310be5d07250.png) -->

## **Getting Started**

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### _Prerequisites_

Requirements you need to run the software and how to get them.

1. [Git](https://git-scm.com/downloads)
2. [NodeJs](https://nodejs.org/en/download)
3. [Mongodb](https://www.mongodb.com/docs/manual/tutorial/getting-started/)
4. [Oauth tokens for your email to setup nodemailer](https://www.freecodecamp.org/news/use-nodemailer-to-send-emails-from-your-node-js-server/)
5. [Razorpay account](https://dashboard.razorpay.com/signup)
6. [Cloudinary account](https://cloudinary.com/users/register_free)
   ...etc

### _Installation_

A step by step series of examples that tell you how to get a development env running.

Clone this repository to your local system.

```
git clone https://github.com/shamilkotta/offpitch_Backend.git
```

Then go to this project directory by running command `cd offpitch_Backend`

Firstly install the required packages

```
yarn install
```

Then you've to setup env file. <br>
Create a `.env` file and paste the keys inthe [`sample.env`](/sample.env) and add your values.

Then start the dev server by executing

```
yarn run dev
```

Now you can navigate to browser in url http://localhost:5000 (by default) to see the output.

### _Coding style tests_

Check if any files need to be formatted, if the check fails that means some files needed to be formatted or have to do some fixes.

eslint

```
yarn run lint
```

prettier

```
yarn run format:check
```

To format all required code files

```
yarn run lint:fix
yarn run format
```

## **Contributing**

Read contributing instructions and guidlines from [here](/CONTRIBUTING.md).

## **Built Using**

- [NodeJs](https://nodejs.org/en/)
- [MongoDB](https://www.mongodb.com/)
- [Express](http://expressjs.com/en/starter/installing.html)
- [Mongoose](https://mongoosejs.com/)

## **Author**

- [@shamilkotta](https://github.com/shamilkotta)

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind are welcome!
