<script>
    import Footer from "./Footer.svelte";
let ques =[];
let i=0;
let score=0;
    async function startquiz(){
   await fetch("https://opentdb.com/api.php?amount=15&category=18&difficulty=medium&type=multiple")
    .then(res =>{
        return res.json();
    })
    .then(questions =>{
        ques=questions.results;
        console.log(ques);
    })
}
let st = "Enter";
let nm;
let c=0;
let start = 0;
let check = 0;
let t="Enter Your Name";
</script>

<style>
body{
    background: linear-gradient(to left,#283593,#1976d2);
    background-size: cover;
    background-repeat: no-repeat;
    font-family: 'Montserrat', sans-serif;
    height: auto;
} 
   .container2{
        height: auto;
        width: 60%;
        align-items: center;
        text-align: center;
        margin-top: 4rem;
    background: rgba(255,255,255,0.2);
    }
   #qn{
       font-size: 6rem;
       color: white;
       font-weight: 500;
       text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
   } 
#start{
    margin-top: 8rem;
    padding: 2rem;
    border-radius: 50rem;
    font-size: 2.5rem;
    width: 20rem;
    outline: none;
    border: transparent;
    text-transform: uppercase;
    background: rgba(255,255,255,0.2);
    box-shadow: .4rem .4rem 4rem rgba(0,0,0,0.7);
    border-radius: 50rem;
    font-weight: 600;
    color: white;
    transition: .3s ease;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
}
#start:hover{
    background: rgba(255,255,255,0.3);
    box-shadow: .4rem .4rem 6rem .8rem rgba(0,0,0,0.5);
    transform: scale(1.1);
}
#name{
    height: 5rem;
    width: 39rem;
    border-radius: 50rem;
    padding-left: 2rem ;
    border: none;
    color: #fff;
    margin-top: 10rem;
    font-weight: 500;
    font-size: 2.6rem;
    border-top: .2rem solid rgba(255,255,255,0.3);
    border-left: .2rem solid rgba(255,255,255,0.3);
    box-shadow: .4rem .4rem 4rem rgba(0,0,0,0.7);
}
#name:hover{
    background: rgba(255,255,255,0.3);
    box-shadow: .4rem .4rem 6rem .8rem rgba(0,0,0,0.5);
}
input{
    background: transparent;
    color: #fff;
    outline: none;
}
#sb{
    margin-top: 5rem;
    font-size: 4rem;
    color: white;
    font-weight: 500;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
}
::placeholder{
    color: #fff;
    font-weight: 400;
    text-shadow: .2rem .3rem .4rem rgba(0,0,0,0.4);
}
#quest{
    font-size: 3rem;
    color: white;
    font-weight: 500;
    margin: 2rem 0;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
    width: 80%;
    height: auto;
    margin: 3rem auto;
    padding: 2rem 2.5rem;
    padding-top: .5rem;
    backdrop-filter: blur(.5rem);
    -webkit-backdrop-filter: blur(.5rem);
    background: rgba(255,255,255,0.2);
    border-radius: 3.5rem;
    border-top: .3rem solid rgba(255,255,255,0.3);
    border-left: .3rem solid rgba(255,255,255,0.3);
    box-shadow: 2rem 2rem 4rem -.6rem rgba(0,0,0,0.7);
}
#ans{
    font-size: 2rem;
    padding: 2rem;
    margin: 1rem auto;
    border-radius: 50rem;
    font-size: 2.5rem;
    width: max-content;
    outline: none;
    border: transparent;
    text-transform: uppercase;
    background: rgba(255,255,255,0.2);
    box-shadow: .4rem .4rem 4rem rgba(0,0,0,0.7);
    border-radius: 50rem;
    font-weight: 600;
    color: white;
    transition: .3s ease;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
}
#ans:hover{
    background-color: rgb(250, 149, 149);
}
#ansr{
    font-size: 2rem;
    padding: 2rem;
    margin: 1rem auto;
    border-radius: 50rem;
    font-size: 2.5rem;
    width: max-content;
    outline: none;
    border: transparent;
    text-transform: uppercase;
    background: rgba(255,255,255,0.2);
    box-shadow: .4rem .4rem 4rem rgba(0,0,0,0.7);
    border-radius: 50rem;
    font-weight: 600;
    color: white;
    transition: .3s ease;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
}
#ansr:hover{
    background-color: rgb(93, 230, 93);
}
#nxt{
    padding: 2rem;
    border-radius: 50rem;
    font-size: 2.5rem;
    width: 20rem;
    outline: none;
    margin: 5rem 0rem;
    border: transparent;
    text-transform: uppercase;
    background: rgba(255,255,255,0.2);
    box-shadow: .4rem .4rem 4rem rgba(0,0,0,0.7);
    border-radius: 50rem;
    font-weight: 600;
    color: white;
    transition: .3s ease;
    text-shadow: .2rem .2rem .4rem rgba(0,0,0,0.5);
}
#nxt:hover{
    background: rgba(255,255,255,0.3);
    box-shadow: .4rem .4rem 6rem .8rem rgba(0,0,0,0.5);
    transform: scale(1.1);
}
#sc{
    font-size: 4rem;
    text-align: center;
}
.form{
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    height: auto;
        width: 100%;
        align-items: center;
        text-align: center;
        margin-top: 4rem;
    background: burlywood;
}
</style>
<body>
    
    <div class="container container2">
        <p id="qn">Quiz</p>
        {#if start ==0}
        <input type="text" placeholder="Enter your Name" id="name" bind:value={nm}>
          {#if c ==1}
          <p id="sb">Welcome {nm}!<br>Let's Start The Quiz!</p> 
          {/if}
        <button id="start" on:click={()=>{
            c = 1;
            check++;
            st="Start Quiz";
              if(check>1)
              {
                  startquiz();
                  start = 1;
                  return start;
              }
        }}>{st}</button>
        {:else if start ==1}
        {#each ques as que}
        <div class="form">
            <p id="quest">{que.question}</p>
            <button id="ansr" on:click={()=>{
                score = score + 1;
            }}>{que.correct_answer}</button>
            <button id="ans">{que.incorrect_answers[0]}</button>
            <button id="ans">{que.incorrect_answers[1]}</button>
            <button id="ans">{que.incorrect_answers[2]}</button>
            <button id="nxt" on:click={()=>{
                start = 2;
            }}>End</button>
        </div>
        {/each}
        {:else}
        <h3 id="sc">Your Score is<br>{score}</h3>
        <button id="nxt" on:click={()=>{
            start = 0;
        }}>Home</button>
        {/if}
    </div>
    <Footer/>
</body>


