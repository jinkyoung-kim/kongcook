// 작업일: 2026-06-26
// SQLite 데이터를 Neon PostgreSQL로 마이그레이션하는 스크립트

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// .env.local 에서 DATABASE_URL 읽기
const envPath = join(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf8");
const match = envContent.match(/DATABASE_URL=(.+)/);
if (!match) throw new Error("DATABASE_URL not found in .env.local");
const DATABASE_URL = match[1].trim();

const sql = neon(DATABASE_URL);

const recipes = [
  {"id":"79abe06f-6d80-4298-a132-a7fa452ba922","title":"가지 볶음","source_url":"https://www.youtube.com/watch?v=flFFrVcMyiI","source_type":"youtube","thumbnail_url":"https://img.youtube.com/vi/flFFrVcMyiI/hqdefault.jpg","description":"달콤 짭조름하고 살짝 매콤한 맛의 건강 가지 볶음으로, 밥 대신 먹어도 좋은 저칼로리 요리","servings":"2인분","cook_time":"20분","difficulty":"easy","tags":"[\"볶음\",\"채소요리\",\"다이어트\",\"저칼로리\",\"간단\",\"비건\"]","memo":null,"raw_content":null,"created_at":1777389486},
  {"id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","title":"토마토 두부 계란 볶음","source_url":"https://www.youtube.com/watch?v=0vYQUs5H5dU","source_type":"youtube","thumbnail_url":"https://img.youtube.com/vi/0vYQUs5H5dU/hqdefault.jpg","description":"갱년기에 좋은 10분 완성 다이어트 토마토 두부 계란 요리","servings":"1인분","cook_time":"10분","difficulty":"easy","tags":"[\"볶음\",\"다이어트\",\"간단요리\",\"갱년기\",\"저칼로리\"]","memo":null,"raw_content":null,"created_at":1777389725},
  {"id":"13f9d3e7-1018-4949-b359-0f67f2107d10","title":"바나나 계란 팬케이크 (노밀가루 무설탕)","source_url":"https://www.youtube.com/watch?v=Oy7VwVnGeEE","source_type":"youtube","thumbnail_url":"https://img.youtube.com/vi/Oy7VwVnGeEE/hqdefault.jpg","description":"바나나 1개와 계란 2개만으로 만드는 건강한 노밀가루 무설탕 아침 식사","servings":"1인분","cook_time":"10분","difficulty":"easy","tags":"[\"노밀가루\",\"무설탕\",\"다이어트\",\"간단\",\"고단백\"]","memo":null,"raw_content":null,"created_at":1777390103},
  {"id":"220a15bc-eb8a-439f-9aac-65330380f737","title":"두부계란전 & 계란말이","source_url":"https://blog.naver.com/uggang2/224200031849","source_type":"blog","thumbnail_url":"https://blogthumb.pstatic.net/MjAyNjAyMjhfMjQ2/MDAxNzcyMjg0NDkwMjI2.dCg8kpCN5ZGBA4QBt_Q79H8qqqOB5bnu3T0HqFHNHJsg.5Ees236Yznb9V0yHTuT0DZhQH-vpdFBYLEacGfdiPkwg.JPEG/%B5%CE%BA%CE%B0%E8%B6%F5%C0%FC%B0%E8%B6%F5%B8%BB%C0%CC27.jpg?type=w2","description":"두부계란부침과 계란말이를 한번에 만드는 초간단 아이반찬","servings":"2~4인분","cook_time":null,"difficulty":"easy","tags":"[\"아이반찬\",\"계란요리\",\"간단\",\"반찬\",\"부침\"]","memo":null,"raw_content":null,"created_at":1777427515},
  {"id":"f5df57ab-7456-4ead-86dc-47e3fe494482","title":"최강록 두부탕","source_url":"https://www.instagram.com/reel/DWnDJ3AvgtO/?igsh=eDNqOG8xNmhmdno1","source_type":"instagram","thumbnail_url":"https://scontent-icn2-1.cdninstagram.com/v/t51.71878-15/661716522_2380097609167957_6815928072083241556_n.jpg?stp=cmp1_dst-jpg_e35_s640x640_tt6&_nc_cat=111&ccb=7-5&_nc_sid=18de74&efg=eyJlZmdfdGFnIjoiQ0xJUFMuYmVzdF9pbWFnZV91cmxnZW4uQzMifQ%3D%3D&_nc_ohc=TGgs0KSE2doQ7kNvwFZmHpG&_nc_oc=Adq_z6CnYqHKCV2WNAPDtl3gTBb7mXJcXNj6Dl4Jh-a6OzJE2meAT29Gyegbpu7Aoik&_nc_zt=23&_nc_ht=scontent-icn2-1.cdninstagram.com&_nc_gid=N_FRy_c8mRQtTb1x3MAxCQ&_nc_ss=73689&oh=00_Af0eY0JQdTfHbgtr7Of_AHRtDM4fCG_JuJqXl8oYSPe5YA&oe=69F76934","description":"오징어짬뽕 라면 스프를 활용한 간단하고 얼큰한 두부탕","servings":null,"cook_time":null,"difficulty":"easy","tags":"[\"국물요리\",\"간단\",\"매운\",\"두부요리\",\"라면활용\"]","memo":null,"raw_content":null,"created_at":1777438846}
];

const ingredients = [
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"가지","amount":"3개 (보통 크기)","category":"채소","sort_order":0},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"양파","amount":"1/2개","category":"채소","sort_order":1},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"피망","amount":"1개","category":"채소","sort_order":2},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"냉동 마늘","amount":"1큰술","category":"양념","sort_order":3},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"간장","amount":"1큰술","category":"양념","sort_order":4},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"굴소스","amount":"1큰술","category":"양념","sort_order":5},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"케찹","amount":"1큰술","category":"양념","sort_order":6},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"감미료 또는 설탕","amount":"1/2큰술","category":"양념","sort_order":7},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"올리브 오일","amount":"적당량 (스프레이 또는 1/2큰술씩)","category":"양념","sort_order":8},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"참기름","amount":"한 바퀴","category":"양념","sort_order":9},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"후추","amount":"약간","category":"양념","sort_order":10},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","name":"크러쉬드 레드페퍼","amount":"약간 (선택)","category":"양념","sort_order":11},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"토마토","amount":"2개","category":"채소","sort_order":0},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"두부","amount":"1모","category":"기타","sort_order":1},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"계란","amount":"2개","category":"기타","sort_order":2},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"대파","amount":null,"category":"채소","sort_order":3},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"마늘","amount":null,"category":"채소","sort_order":4},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"간장","amount":null,"category":"양념","sort_order":5},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"굴소스","amount":null,"category":"양념","sort_order":6},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","name":"후추","amount":null,"category":"양념","sort_order":7},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","name":"계란","amount":"2개","category":"기타","sort_order":0},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","name":"바나나","amount":"1개","category":"채소","sort_order":1},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","name":"올리브오일","amount":"적당량","category":"양념","sort_order":2},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","name":"꿀 또는 알룰로스","amount":"적당량 (선택)","category":"양념","sort_order":3},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"두부","amount":"200g","category":"기타","sort_order":0},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"달걀","amount":"7~8개 (두부전용 2개 + 계란말이용 5~6개)","category":"기타","sort_order":1},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"소금","amount":"1꼬집","category":"양념","sort_order":2},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"식용유","amount":"1스푼","category":"양념","sort_order":3},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"들기름","amount":"1스푼","category":"양념","sort_order":4},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"쪽파(대파)","amount":"20g","category":"채소","sort_order":5},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"당근","amount":"13g","category":"채소","sort_order":6},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"꽃소금","amount":"1꼬집","category":"양념","sort_order":7},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"진간장","amount":"1스푼","category":"양념","sort_order":8},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"참치액","amount":"1/2스푼","category":"양념","sort_order":9},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"굵은고춧가루","amount":"1/3스푼","category":"양념","sort_order":10},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"참기름","amount":"1스푼","category":"양념","sort_order":11},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","name":"통깨","amount":"1/2스푼","category":"양념","sort_order":12},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"오징어짬뽕 라면 스프","amount":"1봉","category":"양념","sort_order":0},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"물","amount":"200ml","category":"기타","sort_order":1},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"두부","amount":"1모","category":"기타","sort_order":2},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"계란","amount":"2알","category":"기타","sort_order":3},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"고추기름 또는 라오간마","amount":"한 바퀴","category":"양념","sort_order":4},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","name":"대파 흰대","amount":"약간","category":"채소","sort_order":5}
];

const steps = [
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":1,"description":"깨끗이 씻은 가지는 꼭지를 제거하고 수평으로 길게 자른 뒤 어슷 삼각형 모양으로 큼지막하게 썬다.","tip":"껍질과 속살이 함께 있도록 썰면 익혀도 뭉개지지 않아 요리가 깔끔해진다."},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":2,"description":"양파는 비슷한 크기로 썰어 분리해 두고, 피망도 먹기 좋은 크기로 썰어 준비한다.","tip":null},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":3,"description":"간장 1큰술, 굴소스 1큰술, 케찹 1큰술, 감미료(또는 설탕) 1/2큰술을 잘 섞어 양념을 만든다.","tip":"감미료가 완전히 녹을 때까지 잘 섞는다."},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":4,"description":"팬에 올리브 오일을 스프레이하고 가지를 볶는다. 부피가 줄어들고 살짝 노곤해지면 꺼내 둔다.","tip":"오일 스프레이나 조리용 붓을 사용하면 기름 사용량을 줄여 느끼하지 않게 조리할 수 있다."},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":5,"description":"같은 팬에 오일 1/2큰술을 두르고 양파를 살짝 투명해질 때까지 볶은 뒤 가지와 함께 대기시킨다.","tip":null},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":6,"description":"팬에 오일 1/2큰술을 두르고 냉동 마늘 1큰술을 볶다가 탈 것 같으면 바로 불을 줄이고 준비한 양념을 붓는다.","tip":"마늘이 타면 쓴맛이 나므로 불 조절에 주의한다."},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":7,"description":"양념이 바글바글 끓으면 볶아 둔 가지와 양파, 썰어 둔 피망을 넣는다. 매콤하게 먹고 싶다면 크러쉬드 레드페퍼도 추가한다.","tip":null},
  {"recipe_id":"79abe06f-6d80-4298-a132-a7fa452ba922","step_order":8,"description":"물기 없이 바싹 볶아 양념이 채소에 쏙쏙 스며들면 후추를 갈아 넣고 참기름을 한 바퀴 둘러 마무리한다.","tip":"물기 없이 바싹 볶는 것이 포인트다."},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","step_order":1,"description":"두부는 먹기 좋은 크기로 썰고, 토마토는 한 입 크기로 자른다. 대파와 마늘은 잘게 다진다.","tip":null},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","step_order":2,"description":"달군 팬에 기름을 두르고 마늘과 대파를 볶아 향을 낸 뒤, 두부를 넣어 앞뒤로 노릇하게 굽는다.","tip":"두부는 키친타월로 물기를 제거하면 더 잘 구워진다."},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","step_order":3,"description":"계란을 넣어 스크램블 하듯 익히다가 토마토를 함께 넣고 볶는다.","tip":null},
  {"recipe_id":"c122e4c2-db5f-44f9-88a1-1596a0cef80a","step_order":4,"description":"간장과 굴소스를 넣어 간을 맞추고, 후추로 마무리한 뒤 불을 끈다.","tip":"간장과 굴소스는 취향에 따라 양을 조절한다."},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","step_order":1,"description":"바나나 껍질을 벗기고 포크로 으깬다.","tip":"설탕 반점이 생긴 잘 익은 바나나를 사용하면 더 달콤하고 맛있게 만들 수 있어요. 덜 익은 초록 바나나는 피하세요."},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","step_order":2,"description":"으깬 바나나에 계란 2개를 넣고 잘 섞어 반죽을 만든다.","tip":null},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","step_order":3,"description":"팬에 올리브오일을 두르고 예열한 뒤, 반죽을 올려 양면이 노릇노릇해질 때까지 굽는다.","tip":"계란이 완전히 익으면 바로 먹을 수 있어요."},
  {"recipe_id":"13f9d3e7-1018-4949-b359-0f67f2107d10","step_order":4,"description":"집에 있는 과일이나 견과류를 곁들여 함께 낸다. 기호에 따라 꿀이나 알룰로스를 뿌려 먹는다.","tip":null},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":1,"description":"두부는 키친타월로 겉면의 수분을 제거한 후 1cm 두께로 썰어줍니다. 달걀 2개에 맛소금 한 꼬집을 넣고 포크로 흰자와 노른자가 완전히 섞이도록 충분히 풀어줍니다.","tip":"달걀 덩어리가 없도록 포크로 잘 풀어야 굽는 동안 고운 색이 납니다."},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":2,"description":"두부를 계란물에 듬뿍 적신 후, 식용유 1스푼과 들기름 1스푼을 넣은 팬에 올려 중약불에서 앞뒤로 노릇노릇하게 구워줍니다.","tip":"들기름은 탈 수 있으므로 식용유와 반씩 섞어 사용하면 고소한 맛과 안정적인 조리가 가능합니다."},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":3,"description":"구운 두부전은 바로 접시에 담지 않고 식힘망에 올려 한 김 식혀줍니다.","tip":"두부는 수분 함량이 높아 뜨거운 상태에서 바로 담으면 눅눅해집니다. 식힘망에서 공기 순환을 시켜야 바삭한 식감이 유지됩니다."},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":4,"description":"두부계란전을 만들고 남은 계란물에 달걀 4~5개를 더 넣고 풀어줍니다. 쪽파와 당근은 잘게 다져서 준비하고, 꽃소금 1꼬집을 넣어 포크나 거품기로 고르게 섞어줍니다.","tip":"두부전 만들 때 소금이 이미 들어갔으므로 간은 적게 합니다."},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":5,"description":"사각팬에 약불로 계란물을 붓고 끝부분이 익으면 양쪽에 주걱을 대고 또르르 말아줍니다. 반 이상 익으면 말고, 다시 계란물을 부어 말아주는 과정을 반복합니다.","tip":"말아지는 뒷부분에 식용유를 한 방울씩 떨어뜨리면 계란말이가 노릇하게 익습니다. 네 면을 세워가며 구워야 전체가 균일하게 익습니다."},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":6,"description":"계란말이를 식힘망에서 한 김 식힌 후 1.5~2cm 두께로 썰어줍니다.","tip":null},
  {"recipe_id":"220a15bc-eb8a-439f-9aac-65330380f737","step_order":7,"description":"식힌 두부계란전 위에 간장 양념(쪽파 1~2대, 진간장 1스푼, 참치액 1/2스푼, 굵은고춧가루 1/3스푼, 참기름 1스푼, 통깨 1/2스푼을 섞은 것)을 골고루 올려 완성합니다.","tip":null},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","step_order":1,"description":"냄비에 물 200ml를 넣고 오징어짬뽕 라면 스프를 풀어 끓인다.","tip":"스프를 먼저 물에 잘 녹여야 국물 맛이 균일하게 난다."},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","step_order":2,"description":"국물이 끓으면 두부를 먹기 좋은 크기로 잘라 넣는다.","tip":null},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","step_order":3,"description":"계란 2알을 풀어서 넣고, 고추기름 또는 라오간마를 한 바퀴 둘러준다.","tip":"라오간마를 넣으면 더욱 깊고 얼큰한 맛이 난다."},
  {"recipe_id":"f5df57ab-7456-4ead-86dc-47e3fe494482","step_order":4,"description":"대파 흰대를 송송 썰어 올리고 한 번 더 끓여 마무리한다.","tip":null}
];

async function migrate() {
  console.log("기존 데이터 삭제 중...");
  await sql`DELETE FROM steps`;
  await sql`DELETE FROM ingredients`;
  await sql`DELETE FROM recipes`;

  console.log(`레시피 ${recipes.length}개 삽입 중...`);
  for (const r of recipes) {
    await sql`
      INSERT INTO recipes (id, title, source_url, source_type, thumbnail_url, description, servings, cook_time, difficulty, tags, memo, raw_content, created_at)
      VALUES (
        ${r.id}, ${r.title}, ${r.source_url}, ${r.source_type}, ${r.thumbnail_url},
        ${r.description}, ${r.servings}, ${r.cook_time}, ${r.difficulty}, ${r.tags},
        ${r.memo}, ${r.raw_content}, ${new Date(r.created_at * 1000)}
      )
    `;
  }

  console.log(`재료 ${ingredients.length}개 삽입 중...`);
  for (const ing of ingredients) {
    await sql`
      INSERT INTO ingredients (recipe_id, name, amount, category, sort_order)
      VALUES (${ing.recipe_id}, ${ing.name}, ${ing.amount}, ${ing.category}, ${ing.sort_order})
    `;
  }

  console.log(`조리 단계 ${steps.length}개 삽입 중...`);
  for (const s of steps) {
    await sql`
      INSERT INTO steps (recipe_id, step_order, description, tip)
      VALUES (${s.recipe_id}, ${s.step_order}, ${s.description}, ${s.tip})
    `;
  }

  // 결과 확인
  const [rCount] = await sql`SELECT COUNT(*) FROM recipes`;
  const [iCount] = await sql`SELECT COUNT(*) FROM ingredients`;
  const [sCount] = await sql`SELECT COUNT(*) FROM steps`;
  console.log(`✅ 마이그레이션 완료: recipes=${rCount.count}, ingredients=${iCount.count}, steps=${sCount.count}`);
}

migrate().catch(console.error);
