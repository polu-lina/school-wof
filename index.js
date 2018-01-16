const botClient = require('bot-client')
// var shortid = require('shortid');
// console.log(shortid.generate());

const list = {
	monday:[],
	tuesday:[],
	wednesday:[],
	thursday:[],
	friday:[],
	saturday:[],
	sunday:[]
}
const map = { //Переводим день недели в нужный нам формат
	'понедельник': 'monday',
	'вторник': 'tuesday',
	'среда': 'wednesday',
	'четверг': 'thursday',
	'пятница': 'friday',
	'суббота': 'saturday',
	'воскресенье': 'sunday'
}

// только что созданные вами авторизационные данные
const creds = {
  email: '1234@a.com',
  password:'1234'
}

const state = {
	waitingDate: false,
	waitingTitle: false,
	waitingBody: false,
	waitingDateForListNotes: false,
	waitingDateForDelete: false,
	waitingTitleForDelete: false,
  waitingStreamForDelete: false,
  waitingStreamForCreate: false,
  waitingStreamForSet: false,
  waitingNameForSet: false,
  waitingThreadForCreate: false,
  waitingNameThreadForCreate: false,
	note: {},
	deleteNote: {},
  setStream: {},
  thread: {}
}

const { comment, stream, thread } = botClient.connect(creds)


comment.onDirect(async message => {
	console.log(123)
  // когда кто-то напишет вам личное сообщение 
  // будет работать этот коллбек

  console.log('ON_DIRECT', message)
  const { teamId } = message
  const to = message.data.content.from
  const { data: {text} } = message.data.content.att[0]

  async function botPost(timeId, to, answer){
    const att = [{ type: 'text', data : {text: answer} }]
    await comment.create(teamId, {to, att})
  }

//Создаем стрим
  if (text.match(/create stream/)) {
    const answer = 'Введите название потока'
    botPost(teamId, to, answer)
    state.waitingStreamForCreate = true
    return
  }

  if (state.waitingStreamForCreate == true) { //Проверяем текст, который ввел пользователь
    state.waitingStreamForCreate = false
    const streams = await stream.read(teamId, {})
    var k = 0;
    for (var i=0; i<streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        k++
      }
    }
    if (k == 0){
      const name = text //Присваиваем имя потоку
      const res = await stream.create(teamId, { name: name }) //Все данные о стриме записываем в res 
      //console.log(res)
      streamId = res.data.id //Вытаскиваем id стрима
      stream.setUser(teamId, {id: streamId, userId: to}) //Добавляем в созданный стрим пользователя
      stream.setAdmin(teamId, {id: streamId, userId: to}) //Делаем его администратором
      answer = 'Поток создан'
      botPost(teamId, to, answer) //Выводим, что создан поток
    } else {
      answer = 'Поток c таким именем уже существует'
      botPost(teamId, to, answer)
    }
    return
  }
//


//Удаляем стрим
  if (text.match(/del stream/)) {
    var streamName = []
    const streams = await stream.read(teamId, {})
    console.log(streams)
    for (var i=0; i<streams.data.length; i++){
      if (streams.data[i].admins[0] == message.data.content.to[0]) {
        streamName.push(streams.data[i].name)
      }
    }
    const stream_name = 'Выберите поток, который нужно удалить:\n' + streamName.join('\n') //
    botPost(teamId, to, stream_name)
    state.waitingStreamForDelete = true
    return
  }

  if (state.waitingStreamForDelete == true){
    const streams = await stream.read(teamId, {})
    var k = 0;
    for (var i=0; i<streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        await stream.delete(teamId, {id: streams.data[i]._id})
        k++
      }
    }
    if (k == 0){
      const answer = 'Потока с таким именем нет'
      botPost(teamId, to, answer)
    }else{
      const answer = 'Поток удален'
      botPost(teamId, to, answer)
    }
    return
  }
//
  
//Меняем имя стрима
  //
  if (text.match(/set stream/)) {
    state.waitingStreamForSet = true
    var streamName = []
    const streams = await stream.read(teamId, {})
    console.log(streams)
    for (var i=0; i<streams.data.length; i++){
      if (streams.data[i].admins[0] == message.data.content.to[0]) {
        streamName.push(streams.data[i].name)
      }
    }
    const stream_name = streamName.join('\n')
    answer = 'Выберите поток, у которого нужно изменить имя:\n' + stream_name
    botPost(teamId, to, answer)
    return
  }
  //Ожидаем стрим, который нужно изенить
  if (state.waitingStreamForSet){
    state.waitingStreamForSet = false
    state.waitingNameForSet = true
    const streams = await stream.read(teamId, {})
    for (var i=0; i<streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        state.setStream.streamId = streams.data[i]._id
      }
    }
    answer = 'Введите новое название'
    botPost(teamId, to, answer)
    return
  }
  //Ожидаем новое имя и изменяем
  if (state.waitingNameForSet == true){
    state.waitingNameForSet = false
    stream.setName(teamId, {id: state.setStream.streamId, name: text})
    state.setStream = {}
    answer = 'Поток переименован на ' + text
    botPost(teamId, to, answer)
    return
  }
  
  


  //Создаем треды
  if (text.match(/create thread/)){
    var streamName = []
    const streams = await stream.read(teamId, {})
    console.log(streams)
    for (var i=0; i<streams.data.length; i++){
      if (streams.data[i].admins[0] == message.data.content.to[0]) {
        streamName.push(streams.data[i].name)
      }
    }
    const stream_name = streamName.join('\n')
    const answer = 'Выберите поток, в котором хотите создать задачу:\n' + stream_name
    botPost(teamId, to, answer)
    state.waitingThreadForCreate = true
    return
  }

  if (state.waitingThreadForCreate){
    const streams = await stream.read(teamId, {})
    state.waitingThreadForCreate = false
    for (var i=0; i<streams.data.length; i++){
      if ((streams.data[i].admins[0] == message.data.content.to[0]) && (streams.data[i].name == text)){
        thread.streamId = streams.data[i]._id
        thread.statusId = streams.data[i].threadStatuses[0]
      }
    }
    state.waitingNameThreadForCreate = true
    const answer = 'Введите название задачи'
    botPost(teamId, to, answer)
    return
  }

  if (state.waitingNameThreadForCreate){
    state.waitingNameThreadForCreate = false
    await thread.create(teamId, {
      statusId: thread.statusId, 
      streamId: thread.streamId, 
      title: text, 
      responsibleUserId: to
    })
    const answer = 'Задача ' + text + ' создана'
    botPost(teamId, to, answer)
    return
  }
  //5a38ed8419e9f8001fb1bf5c - userid

  // const streamInfo = await stream.read(teamId, {id: message.data.content.to})
  // console.log('streamInfo > ', streamInfo)
  // await thread.create(teamId, title,)
  // await stream.delete(teamId, {id: streams.data[i]._id})

  if (text.match(/delete note/)) {
  	state.waitingDateForDelete = true
    answer = 'Выберите день недели, из которого вы бы хотели удалить заметку: \n понедельник \n вторник \n среда \n четверг \n пятница \n суббота \n воскресенье'
    botPost(teamId, to, answer)
  	return
  }
  if (state.waitingDateForDelete === true){
  	state.deleteNote.date = text
  	state.waitingDateForDelete = false
  	state.waitingTitleForDelete = true
  	const titles = list[map[text]].map(note => note.title).join('\n')
	  const att = [{ type: 'text', data : {text: titles} }]
  	await comment.create(teamId, {to, att})
  	return
  }
  if(state.waitingTitleForDelete === true){
  	state.waitingTitleForDelete = false
  	state.deleteNote.title = text;
  	const prevArray = list[map[state.deleteNote.date]]
  	const titles = prevArray.map(note => note.title)
  	const index = titles.indexOf(text)
  	list[map[state.deleteNote.date]] = prevArray.slice(0, index).concat(prevArray.slice(index+1, prevArray.length)) 
  	await comment.create(teamId, {to, att: [{ type: 'text', data : {text: "Заметка удалена"} }]})
  	return
  }


  //Выводим заметки
  if (text.match(/list notes/)) {
  	state.waitingDateForListNotes = true
	const name = [{ type: 'text', data : {text: 'Выберите день: \n понедельник \n вторник \n среда \n четверг \n пятница \n суббота \n воскресенье'} }]
	await comment.create(teamId, {to, att: name })
	return
  }
  if (state.waitingDateForListNotes === true) { //Получаем день недели
  	state.waitingDateForListNotes = false;
  	if (list[map[text]].length == 0){ //Проверяем, есть ли заметки
  		const att = [{ type: 'text', data : {text: `У вас нет заметок`} }]
	  	await comment.create(teamId, {to, att})
	  	return
  	}
  	const string = list[map[text]].map(note => `${note.title}: ${note.body}`).join('\n') //Склеиваем все названия заметок и сами заметки в одну строку
  	const att = [{ type: 'text', data : {text: string} }]
  	await comment.create(teamId, {to, att})
  	return
  }



  //Создаем заметку
  if (text.match(/new note/)) {
  	state.waitingDate = true;
  	const att = [{ type: 'text', data : {text: `Выберите день: \n понедельник \n вторник \n среда \n четверг \n пятница \n суббота \n воскресенье`} }]
  	await comment.create(teamId, {to, att})
  	return
  }

  if (state.waitingDate === true) { //Получаем день недели
  	state.waitingDate = false;
  	state.waitingTitle = true;
  	state.note.date = text;
  	const att = [{ type: 'text', data : {text: `Введите название заметки`} }]
  	await comment.create(teamId, {to, att})
  	return
  }

  if (state.waitingTitle === true) { //Получаем название заметки
  	state.waitingTitle = false;
  	state.waitingBody = true;
  	state.note.title = text;
  	console.log('state.waitingBody >', state.waitingBody)
  	const att = [{ type: 'text', data : {text: `Введите содержание заметки`} }]
  	await comment.create(teamId, {to, att})
  	return
  }
  if (state.waitingBody === true) { //Получаем тело заметки
  	console.log('in condition wait body >> ')
  	state.waitingBody = false;
  	state.note.body = text;
  	list[map[state.note.date]].push(state.note); //Добавляем заметку в массив
  	state.note={};
  	const att = [{ type: 'text', data : {text: `Заметка создана` } }]
  	await comment.create(teamId, {to, att})
  	return
  }

  //Приветствие
  const att = [{ type: 'text', data : {text: `Выбери действие, которое мне нужно выполнить:\nnew note\nlist notes\ndelete note\ncreate stream\ndelete stream ` } }]
  await comment.create(teamId, {to, att})

})
