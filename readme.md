This is a meta and simple portuguese dictionary that uses jsdom to fetch the meanings of the words from the most renowned dictionaries, and cleans the meaning from visual garbage and visual noise

## Install the server

Clone it, install dependencies and start the http server

```
git clone https://github.com/jfoclpf/delp.pt
cd delp.pt
npm install
npm start
```

It will open a http server which you can access with your browser at `http://localhost:3038`

## How to use the API

Install the package and ensure no scripts are run

```
npm install delp.pt
```

Now use the API

```js
const delpPt = require('delp.pt')

delpPt.getWordMeaning('amor', (err, result) => {
  if (err) {
    // handle the error
    return
  }
  console.log(results) /*
    [
      'Sentimento que induz a aproximar, a proteger ou a conservar a pessoa pela qual se sente afeição ou ; grande afeição ou afinidade forte por outra pessoa',
      'Sentimento intenso de entre duas pessoas',
      'Ligação com outrem, incluindo geralmente também uma ligação de cariz sexual',
      'Disposição dos para querer ou fazer o bem a algo ou alguém',
      'Entusiasmo ou grande interesse por algo',
      'Aquilo que é desse entusiasmo ou interesse',
      'Qualidade do que é suave ou delicado',
      'Pessoa considerada simpática, agradável ou a quem se quer agradar',
      'Aquilo que é considerado muito positivo ou agradável',
      'Ligação intensa de filosófico, religioso ou transcendente',
      'Grande dedicação ou cuidado',
      'Sentimento, na literatura medieval, que se caracteriza por uma relação de vassalagem entre o cavaleiro e a sua amada',
      'Ligação que recusa as convenções sociais e as instituições legais, o casamento',
      'Ligação espiritual e sem desejo sexual ou sensual',
      'De forma desinteressada',
      'Por causa de; em atenção a'
    ] */

})

```
