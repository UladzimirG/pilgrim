export type RouteWaypoint = {
  id: number;
  name: string;
  distanceKm: number;
  description: string;
  image: string;
};

export const ROUTE_WAYPOINTS: RouteWaypoint[] = [
  {
    id: 1,
    name: 'Saint-Jean-Pied-de-Port',
    distanceKm: 0,
    description:
      'Горная деревушка у подножия Пиренеев — традиционная точка старта французского пути. Узкие мощёные улочки и старинные ворота Сен-Жак провожают паломников в путь.',
    image:
      'https://images.pexels.com/photos/16632273/pexels-photo-16632273.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 2,
    name: 'Перевал Ронсесвальес',
    distanceKm: 27.2,
    description:
      'Высокогорный перевал через Пиренеи. Легендарное место битвы Роланда. Туманы и тишина древнего леса сопровождают подъём на высоту 1457 метров.',
    image:
      'https://images.pexels.com/photos/15331144/pexels-photo-15331144.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 3,
    name: 'Пуэнте-ла-Рейна',
    distanceKm: 65.0,
    description:
      '«Мост королевы» — средневековый каменный мост через реку Арга, построенный в XI веке для паломников. Здесь сливаются французский и арагонский пути.',
    image:
      'https://images.pexels.com/photos/7520321/pexels-photo-7520321.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 4,
    name: 'Эстелья',
    distanceKm: 96.5,
    description:
      'Город источников и вина. Паломники отдыхают у фонтана виноделов, где струится местное вино. Тёплый свет вечерних виноградников освещает дорогу.',
    image:
      'https://images.pexels.com/photos/31953685/pexels-photo-31953685.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 5,
    name: 'Логроньо',
    distanceKm: 132.0,
    description:
      'Столица Риохи. Тенистые аллеи парка дель Эбро и аромат свежего хлеба на улице Лорето. Место, где путник впервые чувствует простор равнины.',
    image:
      'https://images.pexels.com/photos/6213682/pexels-photo-6213682.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 6,
    name: 'Санто-Доминго-де-ла-Кальсада',
    distanceKm: 177.5,
    description:
      'Город святого, строившего мосты и дороги для паломников. В соборе живут белые куры — живое чудо средневековой легенды о спасённом юноше.',
    image:
      'https://images.pexels.com/photos/13020819/pexels-photo-13020819.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 7,
    name: 'Бельорадо',
    distanceKm: 207.0,
    description:
      'Тихий городок у подножия гор Оберенес. Старинная церковь Сан-Педро и руины замка на холме. Здесь начинается подъём к месете — бескрайнему плато.',
    image:
      'https://images.pexels.com/photos/31125297/pexels-photo-31125297.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 8,
    name: 'Бургос',
    distanceKm: 249.0,
    description:
      'Сердце Кастилии. Готический собор Санта-Мария — шедевр XIII века с кружевными шпилями. Дом Эль Сида, героя Реконкисты. Город, где меса встречает историю.',
    image:
      'https://images.pexels.com/photos/37894567/pexels-photo-37894567.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 9,
    name: 'Фромиста',
    distanceKm: 313.0,
    description:
      'Романская церковь Сан-Мартин — чистый образец архитектуры XII века. Равнина месеты простирается до горизонта, ветер гонит облака по бескрайним полям.',
    image:
      'https://images.pexels.com/photos/19107832/pexels-photo-19107832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 10,
    name: 'Леон',
    distanceKm: 337.5,
    description:
      'Королевский город с витражными окнами собора, залитыми светом. Тёплые таверны с очагом и дымящимся супом — желанный привал после долгой месеты.',
    image:
      'https://images.pexels.com/photos/27409013/pexels-photo-27409013.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 11,
    name: 'О-Себрейро',
    distanceKm: 412.0,
    description:
      'Горная деревня с круглыми каменными хижинами пальосас, крытыми соломой. Туман и тишина. Здесь находится священный потир из легенды о чуде Святых Даров.',
    image:
      'https://images.pexels.com/photos/2132096/pexels-photo-2132096.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
  {
    id: 12,
    name: 'Сантьяго-де-Компостела',
    distanceKm: 480.0,
    description:
      'Конец пути. Величественный собор Святого Иакова встречает паломников музыкой волынок и ароматом ладана. Традиция — коснуться колонны Паломника у входа.',
    image:
      'https://images.pexels.com/photos/20545452/pexels-photo-20545452.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  },
];
